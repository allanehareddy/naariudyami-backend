// Government Price Data Scraper & API Integration
import aiConfig from '../../../config/ai-config.js';

export interface PriceData {
  commodity: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;  // Most common price
  date: string;
  market: string;
  source: string;
}

export interface PriceHistory {
  dates: string[];
  prices: number[];
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

class GovernmentPriceScraper {
  private cache: Map<string, { data: PriceData[]; timestamp: number }> = new Map();
  private cacheExpiry = 3600000; // 1 hour

  /**
   * Fetch real-time prices from AGMARKNET (Government of India)
   */
  async fetchAGMARKNETPrices(category: string): Promise<PriceData[]> {
    const cacheKey = `agmarknet:${category}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      if (!aiConfig.pricePrediction.governmentAPIs.agmarknet.enabled) {
        console.log('AGMARKNET API not enabled, using fallback data');
        return this.getFallbackPrices(category);
      }

      // Note: data.gov.in requires API key
      // URL structure: https://api.data.gov.in/resource/{resource_id}
      const apiKey = aiConfig.pricePrediction.governmentAPIs.agmarknet.apiKey;
      
      if (!apiKey) {
        console.log('No AGMARKNET API key, using fallback data');
        return this.getFallbackPrices(category);
      }

      // Map categories to commodity codes
      const commodityMap: Record<string, string> = {
        'textiles': 'cotton',
        'spices': 'turmeric',
        'handicrafts': 'bamboo',
        'food products': 'rice',
        'pottery': 'clay',
      };

      const commodity = commodityMap[category.toLowerCase()] || 'general';

      // Fetch from API
      const url = `${aiConfig.pricePrediction.governmentAPIs.agmarknet.baseUrl}/agmarknet-prices`;
      const response = await fetch(`${url}?api-key=${apiKey}&format=json&filters[Commodity]=${commodity}&limit=50`);

      if (!response.ok) {
        throw new Error('Failed to fetch from AGMARKNET');
      }

      const data = await response.json();
      const prices = this.parseAGMARKNETResponse(data, category);
      
      this.saveToCache(cacheKey, prices);
      return prices;
    } catch (error) {
      console.error('AGMARKNET fetch error:', error);
      return this.getFallbackPrices(category);
    }
  }

  /**
   * Get historical price data for forecasting
   */
  async fetchPriceHistory(category: string, days: number = 90): Promise<PriceHistory> {
    try {
      const prices = await this.fetchAGMARKNETPrices(category);
      
      if (prices.length === 0) {
        return this.generateMockHistory(category, days);
      }

      // Sort by date and extract time series
      const sortedPrices = prices
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-days);

      const dates = sortedPrices.map(p => p.date);
      const priceValues = sortedPrices.map(p => p.modalPrice);

      // Calculate trend
      const recentAvg = priceValues.slice(-7).reduce((a, b) => a + b, 0) / 7;
      const oldAvg = priceValues.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
      const changePercent = ((recentAvg - oldAvg) / oldAvg) * 100;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (changePercent > 5) trend = 'up';
      if (changePercent < -5) trend = 'down';

      return {
        dates,
        prices: priceValues,
        trend,
        changePercent: Math.round(changePercent * 100) / 100,
      };
    } catch (error) {
      console.error('Price history fetch error:', error);
      return this.generateMockHistory(category, days);
    }
  }

  /**
   * Parse AGMARKNET API response
   */
  private parseAGMARKNETResponse(data: any, category: string): PriceData[] {
    try {
      const records = data.records || [];
      return records.map((record: any) => ({
        commodity: record.Commodity || 'Unknown',
        category,
        minPrice: parseFloat(record.Min_Price) || 0,
        maxPrice: parseFloat(record.Max_Price) || 0,
        modalPrice: parseFloat(record.Modal_Price) || 0,
        date: record.Price_Date || new Date().toISOString(),
        market: record.Market_Name || 'Various Markets',
        source: 'AGMARKNET',
      }));
    } catch (error) {
      console.error('Parse error:', error);
      return [];
    }
  }

  /**
   * Fallback: Generate realistic mock price data
   */
  private getFallbackPrices(category: string): PriceData[] {
    const basePrices: Record<string, number> = {
      'textiles': 2000,
      'spices': 150,
      'handicrafts': 500,
      'food products': 100,
      'pottery': 300,
      'jewelry': 1500,
      'home decor': 800,
    };

    const basePrice = basePrices[category.toLowerCase()] || 500;
    const prices: PriceData[] = [];

    // Generate 30 days of mock data with realistic variation
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const seasonality = Math.sin(i / 30 * Math.PI) * 0.1; // Seasonal pattern
      const trend = i * 0.002; // Slight upward trend

      const modalPrice = Math.round(basePrice * (1 + variation + seasonality + trend));

      prices.push({
        commodity: category,
        category,
        minPrice: Math.round(modalPrice * 0.9),
        maxPrice: Math.round(modalPrice * 1.1),
        modalPrice,
        date: date.toISOString().split('T')[0],
        market: 'Multiple Markets',
        source: 'Simulated Data',
      });
    }

    return prices;
  }

  /**
   * Generate mock historical data for forecasting
   */
  private generateMockHistory(category: string, days: number): PriceHistory {
    const basePrices: Record<string, number> = {
      'textiles': 2000,
      'spices': 150,
      'handicrafts': 500,
      'food products': 100,
      'pottery': 300,
    };

    const basePrice = basePrices[category.toLowerCase()] || 500;
    const dates: string[] = [];
    const prices: number[] = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);

      const variation = (Math.random() - 0.5) * 0.15;
      const seasonality = Math.sin(i / 30 * Math.PI) * 0.08;
      const trend = i * 0.001;

      prices.push(Math.round(basePrice * (1 + variation + seasonality + trend)));
    }

    const recentAvg = prices.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const oldAvg = prices.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
    const changePercent = ((recentAvg - oldAvg) / oldAvg) * 100;

    return {
      dates,
      prices,
      trend: changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable',
      changePercent: Math.round(changePercent * 100) / 100,
    };
  }

  private getFromCache(key: string): PriceData[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  private saveToCache(key: string, data: PriceData[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

export const governmentScraper = new GovernmentPriceScraper();

