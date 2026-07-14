import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from '../config/env.validation';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';
import { PaymentSessionUrls } from './interfaces/payment-session-urls.interface';
import { ClientProxy } from '@nestjs/microservices';
import { NATS_SERVICE } from '../config/service';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.STRIPE_SECRET_KEY);

  constructor(@Inject(NATS_SERVICE) private readonly natsClient: ClientProxy) {}

  async createPaymentSession(
    paymentSessionDto: PaymentSessionDto,
  ): Promise<PaymentSessionUrls> {
    const { currency, items, orderId } = paymentSessionDto;

    const lineItems = items.map((item) => ({
      price_data: {
        currency,
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await this.stripe.checkout.sessions.create({
      // Colorcar aquí el ID de mi orden
      payment_intent_data: {
        metadata: { orderId },
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: envs.SUCCESS_STRIPE_URL,
      cancel_url: envs.CANCEL_STRIPE_URL,
    });

    return {
      cancelUrl: session.cancel_url,
      successUrl: session.success_url,
      url: session.url,
    };
  }

  async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        envs.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      res.status(400).send(`Webhook verification failed: ${error.message}`);
      return;
    }

    switch (event.type) {
      case 'charge.succeeded':
        const chargeSucceeded = event.data.object;
        const payload = {
          stripePaymentId: chargeSucceeded.id,
          orderId: chargeSucceeded.metadata.orderId,
          receiptUrl: chargeSucceeded.receipt_url,
        };

        this.natsClient.emit('payment_succeeded', payload);
        break;

      default:
        console.log('Unhandled event type: ', event.type);
    }

    return res.status(200).json({ sig });
  }
}
