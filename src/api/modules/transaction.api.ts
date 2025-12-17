import { AxiosInstance } from "axios";
import type {
  BaseResponse,
  PaginatedResponse,
  Transaction,
  CreateTransactionRequest,
  GetTransactionsRequest,
} from "../types";

/**
 * Transaction API
 * Matches Back-End API endpoints from /api/transaction/*
 */
export class TransactionApi {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Get VNPay IPN (Instant Payment Notification)
   * GET /api/transaction/vnpay-ipn
   */
  async getVnPayIPN(): Promise<BaseResponse<Transaction>> {
    const response = await this.client.get<BaseResponse<Transaction>>(
      "/transaction/vnpay-ipn"
    );
    return response.data;
  }

  /**
   * Get list of transactions
   * GET /api/transaction
   */
  async getTransactions(
    params?: GetTransactionsRequest
  ): Promise<PaginatedResponse<Transaction>> {
    const queryParams: Record<string, unknown> = {
      // New API format
      PatientId: params?.patientId,
      RelatedEntityType: params?.relatedEntityType,
      RelatedEntityId: params?.relatedEntityId,
      FromDate: params?.fromDate,
      ToDate: params?.toDate,
      Status: params?.status,
      Page: params?.page ?? params?.pageNumber,
      Size: params?.size ?? params?.pageSize,
      Sort: params?.sort,
      Order: params?.order,
      // Legacy format for backward compatibility
      pageNumber: params?.pageNumber,
      pageSize: params?.pageSize,
      transactionType: params?.transactionType,
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
    };

    // Remove undefined values
    Object.keys(queryParams).forEach((key) => {
      if (queryParams[key] === undefined || queryParams[key] === null) {
        delete queryParams[key];
      }
    });

    const response = await this.client.get<PaginatedResponse<Transaction>>(
      "/transaction",
      { params: queryParams }
    );
    return response.data;
  }

  /**
   * Get transaction by ID
   * GET /api/transaction?TransactionId={id}
   */
  async getTransactionById(id: string): Promise<BaseResponse<Transaction>> {
    const response = await this.client.get<PaginatedResponse<Transaction>>(
      "/transaction",
      { params: { TransactionId: id } }
    );

    // The API returns a paginated response, extract the first transaction
    const transaction = response.data.data?.[0];

    if (!transaction) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    // Return in BaseResponse format for consistency
    return {
      code: response.data.code,
      message: response.data.message,
      data: transaction,
    };
  }

  /**
   * Create a new transaction
   * POST /api/transaction
   * Uses query parameters: RelatedEntityType and RelatedEntityId
   */
  async createTransaction(
    data: CreateTransactionRequest
  ): Promise<BaseResponse<Transaction>> {
    const queryParams: Record<string, unknown> = {
      RelatedEntityType: data.relatedEntityType,
      RelatedEntityId: data.relatedEntityId,
    };

    const response = await this.client.post<BaseResponse<Transaction>>(
      "/transaction",
      undefined, // No body
      { params: queryParams }
    );
    return response.data;
  }

  /**
   * Create cash payment transaction
   * POST /api/transaction/cash-payment
   * Uses query parameters: RelatedEntityType and RelatedEntityId
   */
  async createCashPayment(
    data: CreateTransactionRequest
  ): Promise<BaseResponse<Transaction>> {
    const queryParams: Record<string, unknown> = {
      RelatedEntityType: data.relatedEntityType,
      RelatedEntityId: data.relatedEntityId,
    };

    const response = await this.client.post<BaseResponse<Transaction>>(
      "/transaction/cash-payment",
      undefined, // No body
      { params: queryParams }
    );
    return response.data;
  }

  /**
   * Create transaction and get payment URL/QR code
   * Uses the standard createTransaction endpoint which returns paymentUrl
   */
  async createPaymentQR(
    data: CreateTransactionRequest
  ): Promise<
    BaseResponse<Transaction & { qrCodeUrl?: string; qrCodeData?: string }>
  > {
    // Create transaction using the new API format
    const transactionResponse = await this.createTransaction(data);
    if (transactionResponse.data?.paymentUrl) {
      return {
        ...transactionResponse,
        data: {
          ...transactionResponse.data,
          qrCodeUrl: transactionResponse.data.paymentUrl,
        },
      };
    }
    // Return transaction response (paymentUrl may be generated later)
    return {
      ...transactionResponse,
      data: {
        ...transactionResponse.data!,
        qrCodeUrl: transactionResponse.data?.paymentUrl,
        qrCodeData: undefined,
      },
    };
  }

  /**
   * Get QR code for existing transaction
   * GET /api/transaction/{id}/qr-code
   * Note: This endpoint may not exist in the new API, using paymentUrl from transaction
   */
  async getTransactionQR(
    id: string
  ): Promise<BaseResponse<{ qrCodeUrl?: string; qrCodeData?: string }>> {
    const transaction = await this.getTransactionById(id);
    return {
      ...transaction,
      data: {
        qrCodeUrl: transaction.data?.paymentUrl,
        qrCodeData: undefined,
      },
    };
  }
}
