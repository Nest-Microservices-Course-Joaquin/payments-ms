import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from '../config/env.validation';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.STRIPE_SECRET_KEY);

  async createPaymentSession(
    paymentSessionDto: PaymentSessionDto,
  ): Promise<Stripe.Checkout.Session> {
    const { currency, items } = paymentSessionDto;

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
        metadata: {},
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: `http://localhost:3003/payments/success`,
      cancel_url: `http://localhost:3003/payments/cancelled`,
    });

    return session;
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
        // TODO: llamar al microservicio de orders
        console.log('Event: ', event);
        break;

      default:
        console.log('Unhandled event type: ', event.type);
    }

    return res.status(200).json({ sig });
  }
}
