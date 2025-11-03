import { IsString, IsNotEmpty, IsArray, IsObject, IsNumber, IsEnum, IsOptional, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export enum CampaignType {
  AWARENESS = 'Awareness',
  TRAFFIC = 'Traffic',
  ENGAGEMENT = 'Engagement',
  LEADS = 'Leads',
  APP_PROMOTION = 'AppPromotion',
  SALES = 'Sales',
}

export enum RedirectionType {
  LANDING_PAGE = 'LANDING_PAGE',
  LEAD_FORM = 'LEAD_FORM',
  DEEPLINK = 'DEEPLINK',
}

export enum BudgetMode {
  CBO = 'CBO', // Campaign Budget Optimization
  ABO = 'ABO', // Ad Set Budget Optimization
}

export enum BudgetType {
  DAILY = 'daily',
  LIFETIME = 'lifetime',
}

export class DestinationDto {
  @IsEnum(RedirectionType)
  type!: RedirectionType

  @IsOptional()
  @IsString()
  url?: string

  @IsOptional()
  @IsString()
  formId?: string

  @IsOptional()
  @IsString()
  deeplink?: string
}

export class GeneratedAdDto {
  @IsString()
  id!: string

  @IsString()
  adSetId!: string

  @IsString()
  name!: string

  @IsString()
  format!: 'Image' | 'Video' | 'Carousel'

  @IsString()
  creativeUrl!: string

  @IsString()
  headline!: string

  @IsString()
  primaryText!: string

  @IsString()
  cta!: string

  @ValidateNested()
  @Type(() => DestinationDto)
  destination!: DestinationDto

  @IsString()
  finalUrlWithParams!: string
}

export class GeoLocationsDto {
  @IsArray()
  @IsString({ each: true })
  countries!: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cities?: string[]
}

export class DemographicsDto {
  @IsNumber()
  ageMin!: number

  @IsNumber()
  ageMax!: number

  @IsString()
  gender!: 'All' | 'Male' | 'Female'

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[]
}

export class AudiencePresetDto {
  @IsString()
  id!: string

  @IsString()
  type!: 'BROAD' | 'INTEREST' | 'LOOKALIKE' | 'CUSTOM_AUDIENCE'

  @IsString()
  name!: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[]

  @IsOptional()
  @IsString()
  lookalikeSource?: string

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  lookalikePercentages?: number[]

  @IsOptional()
  @IsString()
  customAudienceId?: string
}

export class GeneratedAdSetDto {
  @IsString()
  id!: string

  @IsString()
  name!: string

  @ValidateNested()
  @Type(() => AudiencePresetDto)
  audience!: AudiencePresetDto

  @IsString()
  placementPreset!: string

  @IsArray()
  @IsString({ each: true })
  placements!: string[]

  @ValidateNested()
  @Type(() => GeoLocationsDto)
  geoLocations!: GeoLocationsDto

  @ValidateNested()
  @Type(() => DemographicsDto)
  demographics!: DemographicsDto

  @IsString()
  optimizationEvent!: string

  @IsOptional()
  @IsNumber()
  budget?: number

  @IsOptional()
  @IsEnum(BudgetType)
  budgetType?: BudgetType

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeneratedAdDto)
  ads!: GeneratedAdDto[]
}

export class CampaignConfigDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsEnum(CampaignType)
  type!: CampaignType

  @IsOptional()
  @IsString()
  objective?: string

  @IsOptional()
  @IsString()
  country?: string

  @IsEnum(RedirectionType)
  redirectionType!: RedirectionType

  @IsOptional()
  @IsString()
  redirectionUrl?: string

  @IsOptional()
  @IsString()
  redirectionFormId?: string

  @IsOptional()
  @IsString()
  redirectionDeeplink?: string

  @IsEnum(BudgetMode)
  budgetMode!: BudgetMode

  @IsEnum(BudgetType)
  budgetType!: BudgetType

  @IsOptional()
  @IsNumber()
  budget?: number

  @IsString()
  startDate!: string

  @IsOptional()
  @IsString()
  endDate?: string

  @IsOptional()
  @IsString()
  urlParamsOverride?: string
}

export class CreateBulkLaunchDto {
  @IsString()
  @IsNotEmpty()
  userId!: string

  @IsString()
  @IsNotEmpty()
  clientId!: string

  @IsString()
  @IsNotEmpty()
  adAccountId!: string

  @ValidateNested()
  @Type(() => CampaignConfigDto)
  campaign!: CampaignConfigDto

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeneratedAdSetDto)
  adSets!: GeneratedAdSetDto[]

  @IsObject()
  stats!: {
    adSets: number
    adsPerAdSet: number
    totalAds: number
  }
}
