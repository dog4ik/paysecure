import { z } from "zod";
import {
  normalizeExtraReturnParam,
  type ConnectStatus,
  type Settings,
} from "../connect/index.js";
import { InteractionSpan, InteractionLogs } from "../interaction_logs.js";
import type { StatusRequest as ConnectStatusRequest } from "../connect/status.js";
import type { ConnectPayinRequest } from "../connect/payin.js";
import { PurchasePayloadSchema, type CreatePaymentParams } from "./payin.js";
import {
  CustomerCreateResponseSchema,
  GetCustomerResponseSchema,
  type CreateCustomerPayload,
  type GetCustomerPayload,
} from "./customer.js";
import {
  PaymentSessionResponseSchema,
  type CreateSessionRequest,
} from "./session.js";
import { ErrorSchema, GatewayError } from "./error.js";
import { ApiBaseUrl, AppBaseUrl, CallbackUrl } from "../index.js";
import { StatusResponseSchema } from "./status.js";
import axios from "axios";

export type GatewayResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: GatewayError;
    };

export function gatewayStatusMapping(gatewayStatus: string) {
  const StatusMapping: Record<string, ConnectStatus> = {
    PAID: "approved",
    PAYMENT_IN_PROCESS: "pending",
    EXPIRED: "declined",
    ERROR: "declined",
  };
  return StatusMapping[gatewayStatus.toUpperCase()] ?? "pending";
}

function throwGatewayErrors<T>(res: GatewayResult<T>) {
  if (res.ok) {
    return res.data;
  }
  throw res.error;
}

export class GatewayClient {
  interactionLogs: InteractionLogs;
  constructor(private settings: Settings) {
    this.interactionLogs = new InteractionLogs();
  }

  private async _makeRequest<T>(
    span: InteractionSpan,
    method: string,
    url: string,
    responseSchema: z.ZodSchema<T>,
    data?: Record<string, any>,
  ): Promise<GatewayResult<T>> {
    let headers: Record<string, string> = {};
    headers["authorization"] = `Bearer ${this.settings.api_key}`;
    headers["BrandId"] = this.settings.brand_id;
    let body = data ? JSON.stringify(data) : undefined;
    if (body !== undefined) {
      headers["content-type"] = "application/json";
    }
    console.log(`Making ${method} request to ${url}`, body);
    span.set_request(url, body);

    // We have to use axios because gateway is not following fetch standard.
    let response = await axios(url, {
      method,
      data,
      headers,
      validateStatus: () => true,
      responseType: "text",
    });

    span.set_response_status(response.status);
    let text = await response.data;

    console.log(`Gateway response(${response.status}): `, text);
    span.set_response_body(text);

    // "You will not get Error codes if HTTPS response code is 200 or 202."
    if (response.status == 200 || response.status == 202) {
      return { ok: true, data: responseSchema.parse(JSON.parse(text)) };
    } else {
      return {
        ok: false,
        error: new GatewayError(ErrorSchema.parse(JSON.parse(text))),
      };
    }
  }

  async appRequest<T>(
    span: InteractionSpan,
    method: string,
    path: string,
    responseSchema: z.ZodSchema<T>,
    data?: Record<string, any>,
  ) {
    return this._makeRequest(
      span,
      method,
      AppBaseUrl + path,
      responseSchema,
      data,
    );
  }

  async apiRequest<T>(
    span: InteractionSpan,
    method: string,
    path: string,
    responseSchema: z.ZodSchema<T>,
    data?: Record<string, any>,
  ) {
    return this._makeRequest(
      span,
      method,
      ApiBaseUrl + path,
      responseSchema,
      data,
    );
  }

  async status(request: ConnectStatusRequest) {
    return await this.apiRequest(
      this.interactionLogs.span("status"),
      "GET",
      `/api/v1/purchases/${request.payment.gateway_token}`,
      StatusResponseSchema,
    ).then(throwGatewayErrors);
  }

  async purchasesPayin(connectRequest: ConnectPayinRequest) {
    let payment = connectRequest.payment;
    let customer = connectRequest.params.customer;
    let request: CreatePaymentParams = {
      brand_id: connectRequest.settings.brand_id,
      client: {
        email: customer.email,
        full_name:
          `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim(),
        country: customer.country,
        stateCode: customer.state,
        street_address: customer.address,
        city: customer.city,
        zip_code: customer.postcode,
        phone: customer.phone,
      },
      purchase: {
        currency: payment.gateway_currency,
        products: [
          {
            name: payment.product,
            price: payment.gateway_amount / 100,
          },
        ],
      },
      // totalAmount: payment.gateway_amount / 100, // optional, but if present have precedence over sum of prices mentioned above.
      paymentMethod:
        normalizeExtraReturnParam(connectRequest.payment.extra_return_param) ??
        "APPLEPAY-REDIRECT",
      success_redirect: connectRequest.processing_url,
      failure_redirect: connectRequest.processing_url,
      pending_redirect: connectRequest.processing_url,
      success_callback: CallbackUrl,
      failure_callback: CallbackUrl,
    };

    return await this.apiRequest(
      this.interactionLogs.span("payment"),
      "POST",
      "/api/v1/purchases",
      PurchasePayloadSchema,
      request,
    ).then(throwGatewayErrors);
  }

  private async upsertCustomer(connectReq: ConnectPayinRequest) {
    let customer = connectReq.params.customer;
    let payment = connectReq.payment;

    return await this.appRequest(
      this.interactionLogs.span("get_customer"),
      "GET",
      "/api/v1/customer",
      GetCustomerResponseSchema,
      { merchantCustomerId: payment.lead_id.toString() } as GetCustomerPayload,
    ).then(async (gatewayCustomer) => {
      if (gatewayCustomer.ok) {
        return gatewayCustomer.data;
      }

      let request: CreateCustomerPayload = {
        country: customer.country,
        address: customer.address,
        city: customer.city,
        dateOfBirth: customer.birthday,
        emailId: customer.email,
        merchantCustomerId: payment.lead_id.toString(),
        fullName:
          `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim(),
        phoneNo: customer.phone,
        zipCode: customer.postcode,
        stateCode: customer.state,
      };

      return await this.appRequest(
        this.interactionLogs.span("create_customer"),
        "POST",
        "/api/v1/customer",
        CustomerCreateResponseSchema,
        request,
      ).then(throwGatewayErrors);
    });
  }

  async cashierPayin(connectRequest: ConnectPayinRequest) {
    let customerId = await this.upsertCustomer(connectRequest).then(
      (customer) => customer.customerId,
    );

    let payment = connectRequest.payment;
    let request: CreateSessionRequest = {
      customerId,
      currency: payment.gateway_currency,
      products: [
        {
          name: payment.product,
          price: (payment.gateway_amount / 100).toFixed(2),
        },
      ],
      // totalAmount: "22", // optional, but if present have precedence over sum of prices mentioned above.
      paymentMethod:
        normalizeExtraReturnParam(payment.extra_return_param) ?? undefined,
      success_redirect: connectRequest.processing_url,
      failure_redirect: connectRequest.processing_url,
      pending_redirect: connectRequest.processing_url,
      success_callback: CallbackUrl,
      failure_callback: CallbackUrl,
    };

    return await this.apiRequest(
      this.interactionLogs.span("create_session"),
      "POST",
      "/api/v1/createSession",
      PaymentSessionResponseSchema,
      request,
    ).then(throwGatewayErrors);
  }
}
