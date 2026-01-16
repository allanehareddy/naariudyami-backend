/**
 * Utility functions to transform MongoDB documents to API response format
 * Converts _id to id for consistent API responses
 */

export function transformDocument(doc: any): any {
  if (!doc) return null;
  
  if (doc.toObject) {
    doc = doc.toObject();
  }
  
  if (doc._id) {
    doc.id = doc._id.toString();
    delete doc._id;
  }
  
  return doc;
}

export function transformDocuments(docs: any[]): any[] {
  if (!Array.isArray(docs)) return [];
  return docs.map(doc => transformDocument(doc));
}

export function transformPopulatedDocument(doc: any): any {
  if (!doc) return null;
  
  const transformed = transformDocument(doc);
  
  // Transform populated fields
  if (transformed.userId && typeof transformed.userId === 'object') {
    transformed.userId = transformDocument(transformed.userId);
  }
  
  if (transformed.customerId && typeof transformed.customerId === 'object') {
    transformed.customerId = transformDocument(transformed.customerId);
  }
  
  if (transformed.entrepreneurId && typeof transformed.entrepreneurId === 'object') {
    transformed.entrepreneurId = transformDocument(transformed.entrepreneurId);
  }
  
  return transformed;
}

export function transformPopulatedDocuments(docs: any[]): any[] {
  if (!Array.isArray(docs)) return [];
  return docs.map(doc => transformPopulatedDocument(doc));
}


