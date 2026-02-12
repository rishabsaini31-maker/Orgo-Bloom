import { NextRequest } from "next/server";
import { successResponse, ApiError, handleApiError } from "@/lib/api-utils";

/**
 * Calculate shipping cost based on:
 * - Destination (pincode/state)
 * - Total weight
 * - Number of items
 * - Delivery speed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pincode, state, weight, itemCount, speed = "standard" } = body;

    // Validate inputs
    if (!pincode || !state || !weight || !itemCount) {
      throw new ApiError(
        "Missing required fields: pincode, state, weight, itemCount",
        400,
      );
    }

    // Shipping rate calculation (can be enhanced with real logistics API)
    let baseCost = 0;
    let deliveryDays = 5;

    // Step 1: Base cost based on weight (per kg)
    // ₹50 base + ₹30 per kg for first 5kg, then ₹15 per additional kg
    const weightCost = weight <= 5 ? weight * 30 : 150 + (weight - 5) * 15;
    baseCost = 50 + weightCost;

    // Step 2: Regional surcharge (distance-based)
    const remoteStates = [
      "Ladakh",
      "Jammu & Kashmir",
      "Arunachal Pradesh",
      "Mizoram",
      "Nagaland",
      "Tripura",
      "Manipur",
      "Sikkim",
    ];

    if (remoteStates.includes(state)) {
      baseCost *= 1.5; // 50% surcharge for remote areas
      deliveryDays = 10;
    } else if (["Rajasthan", "Gujarat", "Maharashtra"].includes(state)) {
      baseCost *= 1.15; // 15% surcharge for medium distance
      deliveryDays = 7;
    } else {
      // Standard states
      deliveryDays = 5;
    }

    // Step 3: Express/Standard/Economy options
    let shippingCost = baseCost;
    let finalDeliveryDays = deliveryDays;

    if (speed === "express") {
      shippingCost *= 1.5; // 50% premium for express
      finalDeliveryDays = Math.max(2, Math.floor(deliveryDays / 2));
    } else if (speed === "economy") {
      shippingCost *= 0.8; // 20% discount for economy
      finalDeliveryDays = Math.ceil(deliveryDays * 1.5);
    }

    // Step 4: Free shipping for orders > ₹2000
    let discount = 0;
    const originalCost = shippingCost;
    // Note: total amount would be passed separately, applying discount at checkout

    // Step 5: Round to nearest 10
    shippingCost = Math.ceil(shippingCost / 10) * 10;

    return successResponse({
      data: {
        shippingCost: Math.max(40, shippingCost), // Minimum ₹40
        originalCost,
        discount,
        estimatedDelivery: finalDeliveryDays,
        deliveryEstimate: {
          from: finalDeliveryDays,
          to: finalDeliveryDays + 2, // Range
          unit: "days",
        },
        breakdown: {
          baseCost: 50,
          weightCost: Math.round(weightCost),
          regionalSurcharge: state
            ? remoteStates.includes(state)
              ? Math.round(baseCost * 0.5)
              : ["Rajasthan", "Gujarat", "Maharashtra"].includes(state)
                ? Math.round((baseCost - 50 - weightCost) * 0.15)
                : 0
            : 0,
          speedMultiplier:
            speed === "express" ? "1.5x" : speed === "economy" ? "0.8x" : "1x",
        },
        options: [
          {
            id: "express",
            name: "Express Delivery",
            description: "2-3 days",
            cost: Math.ceil((baseCost * 1.5) / 10) * 10,
            days: 2,
          },
          {
            id: "standard",
            name: "Standard Delivery",
            description: `${Math.max(5, Math.floor(deliveryDays / 2))}-${finalDeliveryDays + 2} days`,
            cost: Math.ceil(shippingCost / 10) * 10,
            days: finalDeliveryDays,
          },
          {
            id: "economy",
            name: "Economy Delivery",
            description: `${Math.ceil(deliveryDays * 1.5)}-${Math.ceil(deliveryDays * 1.5) + 2} days`,
            cost: Math.ceil((baseCost * 0.8) / 10) * 10,
            days: Math.ceil(deliveryDays * 1.5),
          },
        ],
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET - Fetch shipping zones and rates (for admin)
 */
export async function GET(request: NextRequest) {
  try {
    // Return shipping zone information
    return successResponse({
      data: {
        zones: {
          tier1: {
            name: "Metro Cities",
            states: ["Delhi", "Maharashtra", "Karnataka"],
            deliveryDays: 3,
            baseRate: 50,
          },
          tier2: {
            name: "Tier 2 Cities",
            states: ["Rajasthan", "Gujarat", "Andhra Pradesh"],
            deliveryDays: 5,
            baseRate: 80,
          },
          tier3: {
            name: "Remote Areas",
            states: [
              "Ladakh",
              "Jammu & Kashmir",
              "Arunachal Pradesh",
              "Mizoram",
            ],
            deliveryDays: 10,
            baseRate: 120,
          },
        },
        weightSlabs: [
          { min: 0, max: 1, rate: 30 },
          { min: 1, max: 5, rate: 30 },
          { min: 5, max: 10, rate: 15 },
          { min: 10, max: 20, rate: 12 },
          { min: 20, max: Infinity, rate: 10 },
        ],
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
