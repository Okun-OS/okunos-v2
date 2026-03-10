import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER || "__starter__"]: "STARTER",
  [process.env.STRIPE_PRICE_PRO || "__pro__"]: "PRO",
  [process.env.STRIPE_PRICE_AGENCY || "__agency__"]: "AGENCY",
};

function planFromPriceId(priceId: string | null | undefined): string {
  if (!priceId) return "FREE";
  return PRICE_TO_PLAN[priceId] || "FREE";
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      if (!workspaceId) break;

      const subscriptionId = session.subscription as string | null;
      let priceId: string | undefined;

      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        priceId = sub.items.data[0]?.price.id;
      }

      const plan = planFromPriceId(priceId);

      await prisma.workspaceSubscription.upsert({
        where: { workspaceId },
        create: {
          workspaceId,
          stripeSubscriptionId: subscriptionId ?? undefined,
          stripePriceId: priceId,
          status: "active",
          planId: plan,
        },
        update: {
          stripeSubscriptionId: subscriptionId ?? undefined,
          stripePriceId: priceId,
          status: "active",
          planId: plan,
        },
      });

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { plan },
      });

      if (session.customer) {
        await prisma.workspace.update({
          where: { id: workspaceId },
          data: { stripeCustomerId: session.customer as string },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const existing = await prisma.workspaceSubscription.findFirst({
        where: { stripeSubscriptionId: sub.id },
      });
      if (!existing) break;

      const priceId = sub.items.data[0]?.price.id;
      const plan = planFromPriceId(priceId);

      await prisma.workspaceSubscription.update({
        where: { id: existing.id },
        data: {
          status: sub.status,
          stripePriceId: priceId,
          planId: plan,
        },
      });

      await prisma.workspace.update({
        where: { id: existing.workspaceId },
        data: { plan },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const existing = await prisma.workspaceSubscription.findFirst({
        where: { stripeSubscriptionId: sub.id },
      });
      if (!existing) break;

      await prisma.workspaceSubscription.update({
        where: { id: existing.id },
        data: { status: "canceled", planId: "FREE" },
      });

      await prisma.workspace.update({
        where: { id: existing.workspaceId },
        data: { plan: "FREE" },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        invoice.parent?.type === "subscription_details"
          ? (invoice.parent.subscription_details?.subscription as string | null)
          : null;
      if (!subscriptionId) break;

      await prisma.workspaceSubscription.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: { status: "past_due" },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
