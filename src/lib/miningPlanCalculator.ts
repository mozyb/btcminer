import { ContractTemplate } from "@/lib/api";

export interface PlanRateInfo {
  costPerTH: number;
  dailyBtcPerTH: number;
  maintenancePerTHDay: number;
  sourcePlanName: string;
}

// Fallback canonical plans matching database contract_templates
export const CANONICAL_PLANS: Array<{
  id: string;
  name: string;
  display_name: string;
  price: number;
  hashrate: number;
  hashrate_unit: string;
  duration: number;
  is_lifetime?: boolean;
  estimated_daily_reward: number;
  estimated_btc_production: number;
  estimated_usd_value: number;
  maintenance_fee: number;
  algorithm: string;
  slug?: string;
}> = [
  {
    id: "aad9b258-c53d-4de2-8419-ace79d0009f7",
    name: "Starter SHA-256",
    display_name: "Starter SHA-256",
    price: 5,
    hashrate: 40,
    hashrate_unit: "TH/s",
    duration: 30,
    estimated_daily_reward: 0.000005,
    estimated_btc_production: 0.00015,
    estimated_usd_value: 12.5,
    maintenance_fee: 0,
    algorithm: "SHA-256",
    slug: "starter-sha256",
  },
  {
    id: "29f3627d-9c09-42ba-88d4-01b258b9b01d",
    name: "Antminer S21",
    display_name: "Antminer S21",
    price: 59,
    hashrate: 81,
    hashrate_unit: "TH/s",
    duration: 30,
    estimated_daily_reward: 0.00004728,
    estimated_btc_production: 0.0014184,
    estimated_usd_value: 120.5,
    maintenance_fee: 0.0000002,
    algorithm: "SHA-256",
    slug: "antminer-s21",
  },
  {
    id: "71744a17-9706-46ed-9cc1-dec7b1aae1e2",
    name: "Pro SHA-256",
    display_name: "Pro SHA-256",
    price: 99,
    hashrate: 145,
    hashrate_unit: "TH/s",
    duration: 90,
    estimated_daily_reward: 0.00007673,
    estimated_btc_production: 0.0069057,
    estimated_usd_value: 587.0,
    maintenance_fee: 0.000002,
    algorithm: "SHA-256",
    slug: "pro-sha256",
  },
  {
    id: "1c8c3629-33c3-493c-a8d5-df05556d1da7",
    name: "Elite SHA-256",
    display_name: "Elite SHA-256",
    price: 199,
    hashrate: 192,
    hashrate_unit: "TH/s",
    duration: 180,
    estimated_daily_reward: 0.00008836,
    estimated_btc_production: 0.0159048,
    estimated_usd_value: 1350.0,
    maintenance_fee: 0.0005,
    algorithm: "SHA-256",
    slug: "elite-sha256",
  },
  {
    id: "f495c7e4-03c9-446d-a11b-6f03cf2680a7",
    name: "Industrial PH",
    display_name: "Industrial PH",
    price: 499,
    hashrate: 200,
    hashrate_unit: "TH/s",
    duration: 365,
    estimated_daily_reward: 0.00009204,
    estimated_btc_production: 0.0335946,
    estimated_usd_value: 2855.0,
    maintenance_fee: 0.0005,
    algorithm: "SHA-256",
    slug: "industrial-ph",
  },
  {
    id: "cc9bacd6-f2d2-4b07-9793-ba09745af23f",
    name: "Scrypt Lite",
    display_name: "Scrypt Lite",
    price: 1290,
    hashrate: 1350,
    hashrate_unit: "MH/s",
    duration: 90,
    estimated_daily_reward: 0.00062127,
    estimated_btc_production: 0.0559143,
    estimated_usd_value: 4752.0,
    maintenance_fee: 0.002,
    algorithm: "Scrypt",
    slug: "scrypt-lite",
  },
  {
    id: "234bc6ba-ccb8-4851-aa5c-fb90ef0b7811",
    name: "Kaspa Boost",
    display_name: "Kaspa Boost",
    price: 3600,
    hashrate: 5599,
    hashrate_unit: "GH/s",
    duration: 90,
    estimated_daily_reward: 0.002,
    estimated_btc_production: 0.18,
    estimated_usd_value: 15300.0,
    maintenance_fee: 0,
    algorithm: "KHeavyHash",
    slug: "kaspa-boost",
  },
];

/**
 * Returns effective unit rates derived directly from active platform mining plans
 * based on selected duration tier (30d, 90d, 180d, 365d).
 */
export function getPlanRateForDuration(durationDays: number, plans?: ContractTemplate[]): PlanRateInfo {
  const source = (plans && plans.length > 0) ? plans : (CANONICAL_PLANS as unknown as ContractTemplate[]);
  const sha256Plans = source.filter(p => p.algorithm === "SHA-256");

  // Find exact duration match or closest plan
  let matched = sha256Plans.find(p => p.duration === durationDays);
  if (!matched && sha256Plans.length > 0) {
    matched = sha256Plans.reduce((prev, curr) => {
      return Math.abs(curr.duration - durationDays) < Math.abs(prev.duration - durationDays) ? curr : prev;
    });
  }

  if (matched && matched.hashrate > 0) {
    const effectivePrice = matched.promotional_price ?? matched.discount_price ?? matched.price;
    const costPerTH = effectivePrice / matched.hashrate;
    const dailyBtcPerTH = matched.estimated_daily_reward / matched.hashrate;
    const maintenancePerTHDay = Math.min(matched.maintenance_fee, 0.001);

    return {
      costPerTH,
      dailyBtcPerTH,
      maintenancePerTHDay,
      sourcePlanName: matched.display_name ?? matched.name,
    };
  }

  // Sensible defaults directly calibrated with Pro SHA-256 ($99 / 145 TH/s / 90d)
  if (durationDays <= 30) {
    return {
      costPerTH: 59 / 81, // ~$0.728/TH
      dailyBtcPerTH: 0.00004728 / 81, // ~0.0000005837 BTC/TH/d
      maintenancePerTHDay: 0.000001,
      sourcePlanName: "Antminer S21 Plan Tier",
    };
  } else if (durationDays <= 90) {
    return {
      costPerTH: 99 / 145, // ~$0.683/TH
      dailyBtcPerTH: 0.00007673 / 145, // ~0.0000005292 BTC/TH/d
      maintenancePerTHDay: 0.000002,
      sourcePlanName: "Pro SHA-256 Plan Tier",
    };
  } else if (durationDays <= 180) {
    return {
      costPerTH: 199 / 192, // ~$1.036/TH
      dailyBtcPerTH: 0.00008836 / 192, // ~0.0000004602 BTC/TH/d
      maintenancePerTHDay: 0.0005,
      sourcePlanName: "Elite SHA-256 Plan Tier",
    };
  } else {
    return {
      costPerTH: 499 / 200, // ~$2.495/TH
      dailyBtcPerTH: 0.00009204 / 200, // ~0.0000004602 BTC/TH/d
      maintenancePerTHDay: 0.0005,
      sourcePlanName: "Industrial PH Plan Tier",
    };
  }
}

export interface MiningPlanCalculation {
  planName: string;
  isExactPlan: boolean;
  matchedPlanId?: string;
  matchedPlanSlug?: string;
  hashrate: number;
  durationDays: number;
  investmentCostUSD: number;
  dailyBTC: number;
  dailyUSD: number;
  monthlyBTC: number;
  monthlyUSD: number;
  totalContractBTC: number;
  totalContractGrossUSD: number;
  totalMaintenanceUSD: number;
  totalNetReturnUSD: number;
  netProfitUSD: number;
  roiPercent: number;
  adjTotalContractBTC: number;
  adjTotalNetUSD: number;
  adjRoiPercent: number;
  breakEvenDays: number;
}

/**
 * Calculates mining output, cost, and ROI strictly aligned with our mining plans.
 */
export function calculateAlignedMiningPlan(params: {
  hashrate: number;
  durationDays: number;
  btcPrice: number;
  diffGrowthPercent?: number;
  selectedPlanId?: string;
  availablePlans?: ContractTemplate[];
}): MiningPlanCalculation {
  const {
    hashrate,
    durationDays,
    btcPrice,
    diffGrowthPercent = 5,
    selectedPlanId,
    availablePlans,
  } = params;

  const allPlans = (availablePlans && availablePlans.length > 0) ? availablePlans : (CANONICAL_PLANS as unknown as ContractTemplate[]);

  // Check if user explicitly selected a platform plan
  const selectedPlan = selectedPlanId ? allPlans.find(p => p.id === selectedPlanId) : undefined;

  let planName = "Custom Hashrate Plan";
  let isExactPlan = false;
  let matchedPlanId = selectedPlan?.id;
  let matchedPlanSlug = selectedPlan?.slug;
  let investmentCostUSD = 0;
  let dailyBTC = 0;
  let maintenanceRate = 0.000002;

  if (selectedPlan) {
    isExactPlan = true;
    planName = selectedPlan.display_name ?? selectedPlan.name;
    matchedPlanId = selectedPlan.id;
    matchedPlanSlug = selectedPlan.slug;
    const effectivePrice = selectedPlan.promotional_price ?? selectedPlan.discount_price ?? selectedPlan.price;
    investmentCostUSD = effectivePrice;
    dailyBTC = selectedPlan.estimated_daily_reward;
    maintenanceRate = Math.min(selectedPlan.maintenance_fee, 0.001);
  } else {
    // Check if the input exactly matches an existing plan
    const exactMatch = allPlans.find(
      p => p.algorithm === "SHA-256" && p.hashrate === hashrate && p.duration === durationDays
    );

    if (exactMatch) {
      isExactPlan = true;
      planName = exactMatch.display_name ?? exactMatch.name;
      matchedPlanId = exactMatch.id;
      matchedPlanSlug = exactMatch.slug;
      investmentCostUSD = exactMatch.promotional_price ?? exactMatch.discount_price ?? exactMatch.price;
      dailyBTC = exactMatch.estimated_daily_reward;
      maintenanceRate = Math.min(exactMatch.maintenance_fee, 0.001);
    } else {
      // Scale from our platform plan rates
      const planRate = getPlanRateForDuration(durationDays, allPlans);
      planName = `Scaled (${planRate.sourcePlanName})`;
      investmentCostUSD = Math.round(hashrate * planRate.costPerTH * 100) / 100;
      dailyBTC = hashrate * planRate.dailyBtcPerTH;
      maintenanceRate = planRate.maintenancePerTHDay;
    }
  }

  const effectiveBtcPrice = btcPrice > 0 ? btcPrice : 85000;
  const dailyUSD = dailyBTC * effectiveBtcPrice;
  const monthlyBTC = dailyBTC * 30;
  const monthlyUSD = monthlyBTC * effectiveBtcPrice;
  const totalContractBTC = dailyBTC * durationDays;
  const totalContractGrossUSD = totalContractBTC * effectiveBtcPrice;

  // Maintenance cost
  const totalMaintenanceUSD = Math.round(maintenanceRate * hashrate * durationDays * 100) / 100;
  const totalNetReturnUSD = Math.max(0, totalContractGrossUSD - totalMaintenanceUSD);
  const netProfitUSD = totalNetReturnUSD - investmentCostUSD;

  // ROI
  const roiPercent = investmentCostUSD > 0
    ? ((totalNetReturnUSD - investmentCostUSD) / investmentCostUSD) * 100
    : 0;

  // Difficulty adjustment
  const diffGrowthFactor = Math.pow(1 + diffGrowthPercent / 100, durationDays / 365);
  const adjTotalContractBTC = totalContractBTC / diffGrowthFactor;
  const adjTotalNetUSD = Math.max(0, (adjTotalContractBTC * effectiveBtcPrice) - totalMaintenanceUSD);
  const adjRoiPercent = investmentCostUSD > 0
    ? ((adjTotalNetUSD - investmentCostUSD) / investmentCostUSD) * 100
    : 0;

  // Break even in days
  const dailyNetUSD = dailyUSD - (maintenanceRate * hashrate);
  const breakEvenDays = dailyNetUSD > 0
    ? Math.max(1, Math.ceil(investmentCostUSD / dailyNetUSD))
    : 0;

  return {
    planName,
    isExactPlan,
    matchedPlanId,
    matchedPlanSlug,
    hashrate,
    durationDays,
    investmentCostUSD,
    dailyBTC,
    dailyUSD,
    monthlyBTC,
    monthlyUSD,
    totalContractBTC,
    totalContractGrossUSD,
    totalMaintenanceUSD,
    totalNetReturnUSD,
    netProfitUSD,
    roiPercent,
    adjTotalContractBTC,
    adjTotalNetUSD,
    adjRoiPercent,
    breakEvenDays,
  };
}
