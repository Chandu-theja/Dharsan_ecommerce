/**
 * Delhivery API Integration
 * - Track shipments
 * - Check serviceability
 * - Create shipments (future)
 */

const DELHIVERY_BASE_URL = process.env.DELHIVERY_API_URL || 'https://track.delhivery.com';
const DELHIVERY_TOKEN = process.env.DELHIVERY_API_TOKEN;

const headers = {
  'Authorization': `Token ${DELHIVERY_TOKEN}`,
  'Content-Type': 'application/json',
};

export interface TrackingUpdate {
  status: string;
  statusCode: string;
  timestamp: string;
  location: string;
  description: string;
}

export interface TrackingResult {
  waybill: string;
  status: string;
  statusCode: string;
  currentLocation: string;
  expectedDelivery?: string;
  updates: TrackingUpdate[];
}

/**
 * Track a Delhivery shipment by waybill number
 */
export async function trackShipment(waybill: string): Promise<TrackingResult | null> {
  try {
    const response = await fetch(
      `${DELHIVERY_BASE_URL}/api/v1/packages/json/?waybill=${waybill}`,
      { headers, next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!response.ok) return null;
    const data = await response.json();

    const shipmentData = data?.ShipmentData?.[0]?.Shipment;
    if (!shipmentData) return null;

    const scans = shipmentData.Scans || [];
    const updates: TrackingUpdate[] = scans.map((scan: any) => ({
      status: scan.ScanDetail?.Instructions || '',
      statusCode: scan.ScanDetail?.Scan || '',
      timestamp: scan.ScanDetail?.ScanDateTime || '',
      location: scan.ScanDetail?.ScannedLocation || '',
      description: scan.ScanDetail?.Instructions || '',
    }));

    return {
      waybill: shipmentData.AWB || waybill,
      status: shipmentData.Status?.Status || 'Unknown',
      statusCode: shipmentData.Status?.StatusCode || '',
      currentLocation: shipmentData.Status?.StatusLocation || '',
      expectedDelivery: shipmentData.ExpectedDeliveryDate,
      updates,
    };
  } catch (error) {
    console.error('Delhivery tracking error:', error);
    return null;
  }
}

/**
 * Check if delivery is available to a pincode
 */
export async function checkServiceability(pincode: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${DELHIVERY_BASE_URL}/c/api/pin-codes/json/?filter_codes=${pincode}`,
      { headers, next: { revalidate: 3600 } }
    );
    if (!response.ok) return true; // Default to serviceable if API fails

    const data = await response.json();
    return data?.delivery_codes?.length > 0;
  } catch {
    return true; // Default to serviceable if API fails
  }
}

/**
 * Map Delhivery status to our OrderStatus enum
 */
export function mapDelhiveryStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'Manifested': 'PROCESSING',
    'In Transit': 'SHIPPED',
    'Out For Delivery': 'OUT_FOR_DELIVERY',
    'Delivered': 'DELIVERED',
    'RTO': 'RETURN_REQUESTED',
    'RTO Delivered': 'RETURNED',
  };
  return statusMap[status] || 'SHIPPED';
}
