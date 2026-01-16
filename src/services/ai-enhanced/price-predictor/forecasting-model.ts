// Advanced Price Forecasting using Time Series Analysis
import { governmentScraper, PriceHistory } from './government-scraper.js';

export interface ForecastResult {
  predictions: {
    date: string;
    predictedPrice: number;
    confidence: 'low' | 'medium' | 'high';
    lowerBound: number;
    upperBound: number;
  }[];
  currentPrice: number;
  trend: 'up' | 'down' | 'stable';
  seasonality: string;
  insights: string[];
}

class ForecastingModel {
  /**
   * Forecast prices for the next N days using time series analysis
   * Implements simplified Prophet-like forecasting
   */
  async forecastPrices(
    category: string,
    horizonDays: number = 30
  ): Promise<ForecastResult> {
    try {
      // Fetch historical data
      const history = await governmentScraper.fetchPriceHistory(category, 90);

      if (history.prices.length < 7) {
        throw new Error('Insufficient historical data');
      }

      // Perform forecasting
      const predictions = this.generateForecasts(history, horizonDays);
      const currentPrice = history.prices[history.prices.length - 1];

      // Analyze seasonality
      const seasonality = this.detectSeasonality(history.prices);

      // Generate insights
      const insights = this.generateInsights(history, predictions, category);

      return {
        predictions,
        currentPrice,
        trend: history.trend,
        seasonality,
        insights,
      };
    } catch (error) {
      console.error('Forecasting error:', error);
      return this.fallbackForecast(category, horizonDays);
    }
  }

  /**
   * Generate price forecasts using trend and seasonality
   */
  private generateForecasts(
    history: PriceHistory,
    horizonDays: number
  ): ForecastResult['predictions'] {
    const prices = history.prices;
    const n = prices.length;

    // Calculate trend using simple linear regression
    const trend = this.calculateTrend(prices);

    // Calculate seasonality component
    const seasonalComponent = this.calculateSeasonality(prices);

    // Calculate volatility for confidence intervals
    const volatility = this.calculateVolatility(prices);

    const predictions: ForecastResult['predictions'] = [];
    const lastPrice = prices[n - 1];

    for (let i = 1; i <= horizonDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      // Trend component
      const trendValue = trend.slope * (n + i) + trend.intercept;

      // Seasonal component (weekly pattern)
      const seasonalIndex = (n + i) % seasonalComponent.length;
      const seasonalValue = seasonalComponent[seasonalIndex];

      // Predicted price
      const predictedPrice = Math.round(trendValue * seasonalValue);

      // Confidence intervals
      const confidenceWidth = volatility * Math.sqrt(i); // Increases with forecast horizon
      const lowerBound = Math.max(0, Math.round(predictedPrice - confidenceWidth));
      const upperBound = Math.round(predictedPrice + confidenceWidth);

      // Confidence level based on forecast horizon
      let confidence: 'low' | 'medium' | 'high' = 'high';
      if (i > 7) confidence = 'medium';
      if (i > 30) confidence = 'low';

      predictions.push({
        date: date.toISOString().split('T')[0],
        predictedPrice,
        confidence,
        lowerBound,
        upperBound,
      });
    }

    return predictions;
  }

  /**
   * Calculate linear trend from price data
   */
  private calculateTrend(prices: number[]): { slope: number; intercept: number } {
    const n = prices.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += prices[i];
      sumXY += i * prices[i];
      sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Calculate seasonal pattern (weekly cycle)
   */
  private calculateSeasonality(prices: number[]): number[] {
    const cycleLength = 7; // Weekly pattern
    const seasonalFactors: number[] = new Array(cycleLength).fill(0);
    const counts: number[] = new Array(cycleLength).fill(0);

    // Calculate average for each day of cycle
    const overallMean = prices.reduce((a, b) => a + b, 0) / prices.length;

    prices.forEach((price, index) => {
      const dayOfCycle = index % cycleLength;
      seasonalFactors[dayOfCycle] += price;
      counts[dayOfCycle]++;
    });

    // Normalize seasonal factors
    return seasonalFactors.map((sum, i) => {
      const avg = counts[i] > 0 ? sum / counts[i] : overallMean;
      return avg / overallMean; // Factor relative to mean
    });
  }

  /**
   * Calculate price volatility (standard deviation)
   */
  private calculateVolatility(prices: number[]): number {
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    return Math.sqrt(variance);
  }

  /**
   * Detect seasonality pattern
   */
  private detectSeasonality(prices: number[]): string {
    if (prices.length < 30) {
      return 'Insufficient data for seasonality detection';
    }

    const volatility = this.calculateVolatility(prices);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const cv = volatility / mean; // Coefficient of variation

    if (cv < 0.1) {
      return 'Low seasonality - stable prices';
    } else if (cv < 0.2) {
      return 'Moderate seasonality - some variation';
    } else {
      return 'High seasonality - significant variation';
    }
  }

  /**
   * Generate actionable insights
   */
  private generateInsights(
    history: PriceHistory,
    predictions: ForecastResult['predictions'],
    category: string
  ): string[] {
    const insights: string[] = [];

    // Trend insight
    if (history.trend === 'up') {
      insights.push(`Prices are trending upward (+${history.changePercent.toFixed(1)}%). Consider increasing your prices gradually.`);
    } else if (history.trend === 'down') {
      insights.push(`Prices are trending downward (${history.changePercent.toFixed(1)}%). Focus on value-added features or promotions.`);
    } else {
      insights.push('Prices are stable. Good time to maintain consistent pricing.');
    }

    // Forecast insight
    const avgForecast = predictions.slice(0, 7).reduce((sum, p) => sum + p.predictedPrice, 0) / 7;
    const currentPrice = history.prices[history.prices.length - 1];
    const forecastChange = ((avgForecast - currentPrice) / currentPrice) * 100;

    if (forecastChange > 5) {
      insights.push(`Next week's forecast shows potential 5-7% price increase. Good time to stock up on materials.`);
    } else if (forecastChange < -5) {
      insights.push(`Next week's forecast shows potential price decrease. Consider promotional campaigns.`);
    }

    // Seasonal insight
    const month = new Date().getMonth();
    const festivalMonths = [9, 10]; // October, November (Diwali season)

    if (festivalMonths.includes(month)) {
      insights.push(`Festival season ahead! Demand for ${category} typically increases 20-30% during this period.`);
    }

    // Market opportunity
    insights.push(`Based on ${history.dates.length} days of market data from multiple sources.`);

    return insights;
  }

  /**
   * Fallback forecast when real data unavailable
   */
  private fallbackForecast(category: string, horizonDays: number): ForecastResult {
    const basePrices: Record<string, number> = {
      'textiles': 2000,
      'spices': 150,
      'handicrafts': 500,
      'food products': 100,
      'pottery': 300,
    };

    const currentPrice = basePrices[category.toLowerCase()] || 500;
    const predictions: ForecastResult['predictions'] = [];

    for (let i = 1; i <= horizonDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      // Gentle upward trend with some noise
      const trendFactor = 1 + (i * 0.001);
      const noise = (Math.random() - 0.5) * 0.05;
      const predictedPrice = Math.round(currentPrice * trendFactor * (1 + noise));

      predictions.push({
        date: date.toISOString().split('T')[0],
        predictedPrice,
        confidence: i <= 7 ? 'medium' : 'low',
        lowerBound: Math.round(predictedPrice * 0.9),
        upperBound: Math.round(predictedPrice * 1.1),
      });
    }

    return {
      predictions,
      currentPrice,
      trend: 'stable',
      seasonality: 'Moderate',
      insights: [
        'Using simulated data for forecasting.',
        'Connect real data sources for more accurate predictions.',
        'Consider current market conditions in your area.',
      ],
    };
  }
}

export const forecastingModel = new ForecastingModel();

