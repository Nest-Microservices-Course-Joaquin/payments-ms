import { Controller, Get, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import Stripe from 'stripe';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-session')
  async createPaymentSession(): Promise<Stripe.Checkout.Session> {
    return this.paymentsService.createPaymentSession();
  }

  @Get('success')
  success() {
    return {
      ok: true,
      message: 'Payment successful',
    };
  }

  @Get('cancelled')
  cancelled() {
    return {
      ok: false,
      message: 'Payment cancelled',
    };
  }

  @Post('webhook')
  async stripeWebhook() {
    return 'stripeWebhook';
  }
}
