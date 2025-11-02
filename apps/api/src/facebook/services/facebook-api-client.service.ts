import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * Centralized HTTP client for Facebook Graph API
 * Handles authentication, error handling, and request formatting
 */
@Injectable()
export class FacebookApiClient {
  private readonly logger = new Logger(FacebookApiClient.name)
  private readonly apiVersion = process.env.FACEBOOK_API_VERSION || 'v24.0'
  private readonly baseUrl = `https://graph.facebook.com/${this.apiVersion}`

  /**
   * Generic GET request to Facebook API
   */
  async get<T = any>(
    endpoint: string,
    accessToken: string,
    params?: Record<string, any>,
    errorContext?: string,
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`
    const config: AxiosRequestConfig = {
      params: {
        access_token: accessToken,
        ...params,
      },
    }

    try {
      this.logger.debug(`GET ${endpoint}`, { params })
      const response: AxiosResponse<T> = await axios.get(url, config)
      return response.data
    } catch (error: any) {
      this.handleError(error, errorContext || `GET ${endpoint}`)
    }
  }

  /**
   * Generic POST request to Facebook API
   */
  async post<T = any>(
    endpoint: string,
    accessToken: string,
    data: Record<string, any>,
    errorContext?: string,
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`
    const config: AxiosRequestConfig = {
      params: {
        access_token: accessToken,
      },
    }

    try {
      this.logger.debug(`POST ${endpoint}`, { data })
      const response: AxiosResponse<T> = await axios.post(url, data, config)
      return response.data
    } catch (error: any) {
      this.handleError(error, errorContext || `POST ${endpoint}`)
    }
  }

  /**
   * Generic PUT request to Facebook API
   */
  async put<T = any>(
    endpoint: string,
    accessToken: string,
    data: Record<string, any>,
    errorContext?: string,
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`
    const config: AxiosRequestConfig = {
      params: {
        access_token: accessToken,
      },
    }

    try {
      this.logger.debug(`PUT ${endpoint}`, { data })
      const response: AxiosResponse<T> = await axios.put(url, data, config)
      return response.data
    } catch (error: any) {
      this.handleError(error, errorContext || `PUT ${endpoint}`)
    }
  }

  /**
   * Generic DELETE request to Facebook API
   */
  async delete<T = any>(
    endpoint: string,
    accessToken: string,
    params?: Record<string, any>,
    errorContext?: string,
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`
    const config: AxiosRequestConfig = {
      params: {
        access_token: accessToken,
        ...params,
      },
    }

    try {
      this.logger.debug(`DELETE ${endpoint}`)
      const response: AxiosResponse<T> = await axios.delete(url, config)
      return response.data
    } catch (error: any) {
      this.handleError(error, errorContext || `DELETE ${endpoint}`)
    }
  }

  /**
   * Batch API request
   * Allows multiple API calls in a single HTTP request
   * @see https://developers.facebook.com/docs/graph-api/batch-requests
   */
  async batch<T = any>(
    accessToken: string,
    requests: Array<{
      method: 'GET' | 'POST' | 'PUT' | 'DELETE'
      relative_url: string
      body?: string
      name?: string
      depends_on?: string
    }>,
  ): Promise<T[]> {
    const response = await this.post<any>(
      '',
      accessToken,
      { batch: JSON.stringify(requests) },
      'Batch API Request',
    )

    // Parse batch responses
    return response.map((item: any) => {
      if (item.code !== 200) {
        this.logger.warn(`Batch request failed with code ${item.code}`, {
          body: item.body,
        })
      }
      return item.body ? JSON.parse(item.body) : null
    })
  }

  /**
   * Centralized error handling for Facebook API
   */
  private handleError(error: any, context: string): never {
    const fbError = error.response?.data?.error

    if (fbError) {
      this.logger.error(`Facebook API Error [${context}]`, {
        message: fbError.message,
        type: fbError.type,
        code: fbError.code,
        error_subcode: fbError.error_subcode,
        fbtrace_id: fbError.fbtrace_id,
      })

      // Create user-friendly error message
      let errorMessage = fbError.message || 'Unknown Facebook API error'

      if (fbError.error_user_msg) {
        errorMessage = fbError.error_user_msg
      }

      throw new Error(`Facebook API Error [${context}]: ${errorMessage}`)
    }

    // Non-Facebook error (network, timeout, etc.)
    this.logger.error(`Request failed [${context}]`, {
      message: error.message,
      code: error.code,
    })

    throw new Error(`Request failed [${context}]: ${error.message}`)
  }

  /**
   * Get the base URL for constructing manual requests if needed
   */
  getBaseUrl(): string {
    return this.baseUrl
  }

  /**
   * Get the API version
   */
  getApiVersion(): string {
    return this.apiVersion
  }
}
