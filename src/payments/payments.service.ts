import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from '../config/env.validation';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.STRIPE_SECRET_KEY);
}
