/**
 * Corporate Affairs Commission (CAC) Nigeria
 * Official Industry Classification & Nature of Business Framework
 * (NISIC / ISIC Rev. 4 Standard as deployed on the CAC Company Registration Portal - CRP)
 */

export interface CACSubCategory {
  id: string;
  name: string;
  isDnfbp?: boolean;
  regulatoryBody?: string;
  requiresSpecialLicense?: boolean;
}

export interface CACSector {
  id: string;
  code: string;
  name: string;
  regulatoryBody?: string;
  subCategories: CACSubCategory[];
}

export const CAC_SECTORS: CACSector[] = [
  {
    id: "agriculture",
    code: "SEC-01",
    name: "Agriculture, Forestry, Fishing & Agro-Allied",
    subCategories: [
      { id: "crop_cultivation", name: "Crop Cultivation, Grains & Horticulture" },
      { id: "livestock", name: "Livestock Farming, Poultry & Animal Husbandry" },
      { id: "aquaculture", name: "Aquaculture, Fisheries & Seafood Processing" },
      { id: "forestry", name: "Forestry, Logging & Timber Operations" },
      { id: "agro_commodity_export", name: "Agro-Commodity Aggregation & International Export" },
      { id: "agro_chemicals", name: "Fertilizers, Agro-Chemicals & Seed Multiplication" },
      { id: "agricultural_mechanization", name: "Agricultural Equipment & Tractor Hire Services" },
    ],
  },
  {
    id: "mining",
    code: "SEC-02",
    name: "Mining, Quarrying & Solid Minerals Exploration",
    regulatoryBody: "Ministry of Solid Minerals Development",
    subCategories: [
      { id: "quarrying", name: "Quarrying, Granite, Sand & Gravel Extraction" },
      { id: "precious_metals", name: "Gold, Lithium, Tantalite & Precious Minerals Mining" },
      { id: "coal_bitumen", name: "Coal, Bitumen & Industrial Minerals Extraction" },
      { id: "mineral_processing", name: "Mineral Processing, Smelting & Beneficiation" },
      { id: "geological_consultancy", name: "Geological Surveys & Exploration Consultancy" },
    ],
  },
  {
    id: "oil_gas",
    code: "SEC-03",
    name: "Oil, Gas & Energy Infrastructure",
    regulatoryBody: "NUPRC / NMDPRA",
    subCategories: [
      { id: "upstream_services", name: "Upstream Oilfield Services, Drilling & Well Maintenance", requiresSpecialLicense: true },
      { id: "midstream_storage", name: "Midstream Pipelines, Depots & Storage Tank Farm Operations", requiresSpecialLicense: true },
      { id: "downstream_retail", name: "Downstream Retailing & Petroleum Filling Stations" },
      { id: "lpg_cng", name: "LPG Gas Bottling, CNG Infrastructure & Auto-Gas Conversion" },
      { id: "renewable_energy", name: "Solar Mini-Grids, Inverter Systems & Renewable Power" },
      { id: "power_generation", name: "Independent Power Generation (IPP), Transmission & Metering", requiresSpecialLicense: true },
    ],
  },
  {
    id: "manufacturing",
    code: "SEC-04",
    name: "Manufacturing & Industrial Production",
    regulatoryBody: "NAFDAC / SON",
    subCategories: [
      { id: "food_beverage", name: "Packaged Foods, Beverages & Confectionery (NAFDAC)", requiresSpecialLicense: true },
      { id: "pharmaceutical_mfg", name: "Pharmaceutical Formulations, Drugs & Medical Consumables", requiresSpecialLicense: true },
      { id: "textile_footwear", name: "Textiles, Garments, Leather Processing & Footwear" },
      { id: "plastics_packaging", name: "Plastics, Polythene, Resins & Corrugated Packaging" },
      { id: "cement_ceramics", name: "Cement, Concrete Blocks, Roofing Sheets & Ceramics" },
      { id: "metal_fabrication", name: "Steel Fabrication, Aluminium & Foundries" },
      { id: "automotive_assembly", name: "Automobile Assembly, Tri-cycles & Spare Parts Fabrication" },
      { id: "cosmetics_cleaning", name: "Cosmetics, Soaps, Detergents & Chemical Reagents" },
    ],
  },
  {
    id: "construction",
    code: "SEC-05",
    name: "Building, Civil Engineering & Real Estate Contracting",
    subCategories: [
      { id: "building_construction", name: "Residential & Commercial Building Construction" },
      { id: "civil_engineering", name: "Civil Engineering (Highways, Bridges & Coastal Works)" },
      { id: "mechanical_electrical", name: "MEP Engineering (Electrical, Plumbing & HVAC Systems)" },
      { id: "interior_finishing", name: "Interior Fit-outs, Dry Construction & Landscaping" },
      { id: "demolition_excavation", name: "Site Excavation, Piling & Controlled Demolition" },
    ],
  },
  {
    id: "ict",
    code: "SEC-06",
    name: "Information & Communication Technology (ICT)",
    regulatoryBody: "NITDA / NCC / NDPC",
    subCategories: [
      { id: "software_saas", name: "Software Development, Cloud Solutions & Enterprise SaaS" },
      { id: "telecoms_isp", name: "Telecommunications Services, Fiber Optic & ISP Networks", requiresSpecialLicense: true },
      { id: "cybersecurity_dpco", name: "Cybersecurity, Penetration Testing & Data Protection (DPCO)", regulatoryBody: "NDPC" },
      { id: "artificial_intelligence", name: "Artificial Intelligence, Data Analytics & Automation" },
      { id: "hardware_infrastructure", name: "Hardware Procurement, Computer Systems & Server Networks" },
      { id: "digital_media_streaming", name: "Digital Media Publishing, Apps & Content Streaming" },
    ],
  },
  {
    id: "fintech_banking",
    code: "SEC-07",
    name: "Financial Services, FinTech & Capital Markets",
    regulatoryBody: "CBN / SEC / NAICOM",
    subCategories: [
      { id: "fintech_pssp", name: "Payment Solutions Service Provider (PSSP) & Payment Gateway", requiresSpecialLicense: true, regulatoryBody: "CBN" },
      { id: "digital_lending_mfi", name: "Digital Lending & Microfinance Institutions", requiresSpecialLicense: true, regulatoryBody: "CBN" },
      { id: "asset_management", name: "Fund, Asset & Portfolio Management", requiresSpecialLicense: true, regulatoryBody: "SEC" },
      { id: "stockbroking_advisory", name: "Stockbroking & Securities Issuing House", requiresSpecialLicense: true, regulatoryBody: "SEC" },
      { id: "insurance_broking", name: "Insurance Underwriting, Insurance Broking & Risk Advisory", requiresSpecialLicense: true, regulatoryBody: "NAICOM" },
      { id: "bdc_fx", name: "Bureau De Change (BDC) & Foreign Exchange Services", requiresSpecialLicense: true, regulatoryBody: "CBN" },
    ],
  },
  {
    id: "wholesale_retail",
    code: "SEC-08",
    name: "Wholesale, Retail Trade & E-Commerce",
    subCategories: [
      { id: "general_merchandise", name: "General Merchandise, Wholesale & International Procurement" },
      { id: "ecommerce_marketplace", name: "E-Commerce Marketplaces & Omnichannel Retail" },
      { id: "supermarkets_fmcg", name: "Supermarkets, FMCG Distribution & Chain Stores" },
      { id: "auto_parts_supplies", name: "Automotive Spare Parts, Batteries & Heavy Equipment" },
      { id: "electronics_gadgets", name: "Consumer Electronics, Telephony & Household Appliances" },
    ],
  },
  {
    id: "dnfbp",
    code: "SEC-09",
    name: "Designated Non-Financial Businesses & Professions (DNFBP)",
    regulatoryBody: "SCUML / EFCC",
    subCategories: [
      { id: "real_estate_agents", name: "Real Estate Brokers, Developers & Property Agents", isDnfbp: true },
      { id: "luxury_jewelers", name: "Dealers in Precious Metals, Stones & High-Value Jewelry", isDnfbp: true },
      { id: "car_dealers", name: "Automobile Dealership & Luxury Vehicle Consignment", isDnfbp: true },
      { id: "casinos_betting", name: "Casinos, Gaming, Sports Betting & Lotteries", isDnfbp: true, requiresSpecialLicense: true },
      { id: "audit_tax_firms", name: "Chartered Accounting, Auditing & Statutory Tax Practices", isDnfbp: true },
      { id: "law_firms_notaries", name: "Legal Practitioners, Law Chambers & Corporate Notaries", isDnfbp: true },
    ],
  },
  {
    id: "logistics_transport",
    code: "SEC-10",
    name: "Transportation, Haulage, Maritime & Aviation",
    regulatoryBody: "NPA / NIMASA / NCAA",
    subCategories: [
      { id: "road_haulage", name: "Interstate Road Haulage, Heavy Trucking & Container Transport" },
      { id: "courier_dispatch", name: "Courier Services, Express Dispatch & E-Commerce Delivery" },
      { id: "maritime_freight", name: "Maritime Shipping, Clearing & Forwarding, Bonded Terminals", requiresSpecialLicense: true },
      { id: "aviation_cargo", name: "Aviation Charter, Air Freight & Flight Support Services", requiresSpecialLicense: true },
      { id: "passenger_transit", name: "Passenger Transit, Bus Terminals & Ride-Hailing Operations" },
      { id: "cold_chain_logistics", name: "Temperature-Controlled Storage & Cold Chain Transport" },
    ],
  },
  {
    id: "hospitality",
    code: "SEC-11",
    name: "Hospitality, Tourism, Food & Events",
    subCategories: [
      { id: "hotels_resorts", name: "Hotels, Resorts, Serviced Apartments & Guest Houses" },
      { id: "qsr_restaurants", name: "Quick Service Restaurants (QSR), Fine Dining & Cafes" },
      { id: "catering_venues", name: "Event Centers, Conference Facilities & Commercial Catering" },
      { id: "tourism_travel", name: "Travel Agencies, International Ticketing & Tourism Services" },
      { id: "lounges_nightlife", name: "Lounges, Recreational Parks & Entertainment Venues" },
    ],
  },
  {
    id: "professional_services",
    code: "SEC-12",
    name: "Professional, Scientific & Consultancy Services",
    subCategories: [
      { id: "management_consulting", name: "Management Consultancy, Strategy & Human Resources" },
      { id: "tax_accounting_support", name: "Accounting Support, Financial Advisory & Payroll Services" },
      { id: "architecture_surveying", name: "Architectural Design, Quantity Surveying & Town Planning" },
      { id: "engineering_consulting", name: "Structural, Civil & Electrical Consulting Engineering" },
      { id: "scientific_research_eia", name: "Environmental Impact Assessment (EIA), Soil & Laboratory Testing" },
    ],
  },
  {
    id: "education",
    code: "SEC-13",
    name: "Education, Research & Human Capital Development",
    regulatoryBody: "Ministry of Education",
    subCategories: [
      { id: "k12_schools", name: "Creche, Nursery, Primary & Secondary Schools (K-12)", requiresSpecialLicense: true },
      { id: "tertiary_colleges", name: "Tertiary Colleges, Polytechnics & Monotechnics", requiresSpecialLicense: true },
      { id: "vocational_academy", name: "Vocational Skills Centers, Aviation Academies & Tech Bootcamps" },
      { id: "professional_training", name: "Corporate Executive Training & Professional Exam Institutes" },
    ],
  },
  {
    id: "healthcare",
    code: "SEC-14",
    name: "Healthcare, Medical Diagnostics & Social Services",
    regulatoryBody: "MDCN / PCN / NHIA",
    subCategories: [
      { id: "hospitals_clinics", name: "Private Hospitals, Dental Clinics & Maternity Centers", requiresSpecialLicense: true },
      { id: "pharmacy_distribution", name: "Community Pharmacies & Bulk Drug Distribution (PCN)", requiresSpecialLicense: true },
      { id: "diagnostics_radiology", name: "Diagnostic Laboratories, Ultrasound, CT-Scan & MRI Imaging" },
      { id: "hmo_insurance", name: "Health Maintenance Organizations (HMO)", requiresSpecialLicense: true, regulatoryBody: "NHIA" },
      { id: "mental_health_wellness", name: "Mental Health Clinics, Physiotherapy & Rehabilitation Services" },
    ],
  },
  {
    id: "real_estate_property",
    code: "SEC-15",
    name: "Real Estate, Property Development & Facility Management",
    subCategories: [
      { id: "estate_development", name: "Residential Housing Estates & Gated Community Development" },
      { id: "commercial_development", name: "Commercial Office Towers, Shopping Malls & Industrial Parks" },
      { id: "facility_maintenance", name: "Facility Management, Estate Security & Utility Maintenance" },
      { id: "land_surveying", name: "Land Cadastral Surveying & Property Valuation" },
    ],
  },
  {
    id: "media_entertainment",
    code: "SEC-16",
    name: "Media, Entertainment, Film & Creative Arts",
    subCategories: [
      { id: "film_nollywood", name: "Film Production, Movie Studios & Cinema Operations" },
      { id: "music_recording", name: "Music Recording, Artist Management & Sound Engineering" },
      { id: "publishing_print", name: "Book Publishing, Commercial Printing & Editorial Media" },
      { id: "advertising_pr", name: "Advertising Agencies, Billboards & Public Relations (PR)" },
    ],
  },
  {
    id: "security_surveillance",
    code: "SEC-17",
    name: "Security, Surveillance & Corporate Intelligence",
    regulatoryBody: "NSCDC",
    subCategories: [
      { id: "private_guard", name: "Private Guard Companies & Uniformed Security Officers", requiresSpecialLicense: true, regulatoryBody: "NSCDC" },
      { id: "electronic_security", name: "Electronic Surveillance, CCTV, Biometric Access & Alarms" },
      { id: "investigation_forensics", name: "Corporate Investigations, Background Vetting & Digital Forensics" },
    ],
  },
  {
    id: "environment_waste",
    code: "SEC-18",
    name: "Waste Management, Recycling & Environmental Protection",
    regulatoryBody: "NESREA",
    subCategories: [
      { id: "solid_waste_recycling", name: "Solid Waste Collection, Plastic & Metal Recycling" },
      { id: "effluent_treatment", name: "Industrial Effluent, Hazardous Waste & Sewage Treatment" },
      { id: "environmental_remediation", name: "Oil Spill Clean-up, Environmental Remediation & Desiltation" },
      { id: "fumigation_cleaning", name: "Commercial Pest Control, Fumigation & Janitorial Services" },
    ],
  },
  {
    id: "incorporated_trustees",
    code: "SEC-19",
    name: "NGOs, Foundations & Faith-Based Organizations (CAC Part F)",
    subCategories: [
      { id: "charitable_foundation", name: "Charitable Trusts, Humanitarian NGOs & Philanthropic Foundations" },
      { id: "faith_based", name: "Religious Institutions, Churches, Mosques & Ministries" },
      { id: "trade_associations", name: "Trade Associations, Chambers of Commerce & Business Alliances" },
      { id: "social_alumni", name: "Social Clubs, Community Development Unions & Alumni Associations" },
    ],
  },
  {
    id: "personal_repair",
    code: "SEC-20",
    name: "Personal, Consumer & Mechanical Repair Services",
    subCategories: [
      { id: "auto_repairs", name: "Automotive Mechanics, Mechatronics & Panel Beating Workshops" },
      { id: "dry_cleaning", name: "Commercial Dry Cleaning, Industrial Laundry & Pressing" },
      { id: "salons_spa", name: "Beauty Salons, Spas & Wellness Establishments" },
    ],
  },
  {
    id: "public_sector",
    code: "SEC-21",
    name: "Public Sector, Institutional Governance & Utilities",
    subCategories: [
      { id: "mda_governance", name: "Ministries, Departments & Agencies (MDAs) of Federal/State Govt" },
      { id: "subeb_institutions", name: "State Universal Basic Education Boards (SUBEB) & Public School Audits" },
      { id: "public_utilities", name: "State Water Corporations & Public Utility Authorities" },
    ],
  },
];

/**
 * Statutory Compliance Employee Headcount Categorization
 * Built strictly according to Nigerian legal thresholds:
 * - CAMA 2020 s.394 (Small Company threshold)
 * - Pension Reform Act 2014 s.2 (Mandatory CPS at 5+ employees)
 * - Industrial Training Fund (ITF) Act s.6 (Mandatory 1% levy at 5+ employees)
 * - National Health Insurance Authority (NHIA) Act 2022
 * - Nigerian Code of Corporate Governance (NCCG) 2018
 */
export interface ComplianceHeadcountTier {
  id: string;
  label: string;
  category: "Micro" | "Small" | "Medium" | "Large" | "Enterprise";
  employeeRange: string;
  statutoryImplications: string;
  mandatoryStatutes: string[];
}

export const COMPLIANCE_HEADCOUNT_TIERS: ComplianceHeadcountTier[] = [
  {
    id: "1-4",
    employeeRange: "1 - 4 Employees",
    category: "Micro",
    label: "Micro (1 - 4) • CAMA Small Exemption, Pension Optional",
    statutoryImplications: "Exempt from mandatory Contributory Pension Scheme (CPS) and ITF 1% levy; eligible for CAMA Small Company financial audit exemptions.",
    mandatoryStatutes: ["CAMA 2020 (Small Company Exemption)", "State PAYE / Personal Income Tax Act"],
  },
  {
    id: "5-14",
    employeeRange: "5 - 14 Employees",
    category: "Small",
    label: "Small (5 - 14) • Mandatory PENCOM & ITF 1% Threshold",
    statutoryImplications: "Crosses legal threshold: mandatory registration with licensed PFAs (10% employer + 8% employee contribution) and 1% Industrial Training Fund (ITF) annual payroll remittance.",
    mandatoryStatutes: ["PRA 2014 (PENCOM Contributory Pension)", "ITF Act (1% Payroll Levy)", "NSITF (Employees' Compensation Act 1%)"],
  },
  {
    id: "15-49",
    employeeRange: "15 - 49 Employees",
    category: "Medium",
    label: "Medium (15 - 49) • NHIA Health Insurance & OSH Safety Required",
    statutoryImplications: "Mandatory corporate health insurance coverage under NHIA Act 2022, workplace First Aid & Occupational Safety Officer under Factories Act, and formal RoPA data privacy registry.",
    mandatoryStatutes: ["NHIA Act 2022 (Mandatory Health Insurance)", "Factories Act (Occupational Health & Safety)", "NDPA 2023 (RoPA Registry)"],
  },
  {
    id: "50-249",
    employeeRange: "50 - 249 Employees",
    category: "Large",
    label: "Large (50 - 249) • NCCG Governance & Statutory Committee Required",
    statutoryImplications: "Requires formal Board Audit & Risk Committees, external statutory audit filing at CAC, full gender diversity reporting under NCCG 2018, and NDPC annual data audit return.",
    mandatoryStatutes: ["NCCG 2018 (Code of Corporate Governance)", "CAMA 2020 Statutory Audit Committee", "NDPC Statutory Annual Audit Return"],
  },
  {
    id: "250+",
    employeeRange: "250+ Employees",
    category: "Enterprise",
    label: "Enterprise (250+) • Multi-Agency Regulatory Certification Required",
    statutoryImplications: "Full multi-agency clearance certificates required annually (PENCOM Compliance Certificate, ITF Certificate of Clearance, NSITF Clearance, CAC Form CAC 19, TaxPro-MAX clearance for public procurement).",
    mandatoryStatutes: ["Public Procurement Act 2007 (Compliance Certificates)", "CAMA 2020 Full Disclosure", "FIRS TaxPro-MAX Clearance"],
  },
];
