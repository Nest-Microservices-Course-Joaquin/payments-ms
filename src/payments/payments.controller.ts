import { Body, Controller, Get, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dto/payment-session.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-session')
  async createPaymentSession(
    @Body() paymentSessionDto: PaymentSessionDto,
  ): Promise<Stripe.Checkout.Session> {
    return this.paymentsService.createPaymentSession(paymentSessionDto);
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
