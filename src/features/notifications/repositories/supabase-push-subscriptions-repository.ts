import type { SupabaseClient } from "@supabase/supabase-js";
import type { PushSubscription, UserPushSubscription } from "../types";

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class SupabasePushSubscriptionsRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * 사용자의 푸시 구독을 저장합니다
   */
  async subscribe(
    userId: string,
    subscription: PushSubscription
  ): Promise<PushSubscriptionRecord | null> {
    const { data, error } = await this.supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh_key: subscription.keys.p256dh,
          auth_key: subscription.keys.auth,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,endpoint",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Failed to subscribe:", error);
      return null;
    }

    return data;
  }

  /**
   * 사용자의 푸시 구독을 취소합니다
   */
  async unsubscribe(userId: string, endpoint: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("push_subscriptions")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("endpoint", endpoint);

    if (error) {
      console.error("Failed to unsubscribe:", error);
      return false;
    }

    return true;
  }

  /**
   * 사용자의 모든 활성 구독을 조회합니다
   */
  async getByUser(userId: string): Promise<PushSubscription[]> {
    const { data, error } = await this.supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh_key, auth_key")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) {
      console.error("Failed to get subscriptions:", error);
      return [];
    }

    return (
      data?.map((record) => ({
        endpoint: record.endpoint,
        keys: {
          p256dh: record.p256dh_key,
          auth: record.auth_key,
        },
      })) ?? []
    );
  }

  /**
   * 특정 사용자들의 활성 구독을 모두 조회합니다
   */
  async getActiveSubscriptions(
    userIds: string[]
  ): Promise<UserPushSubscription[]> {
    if (userIds.length === 0) return [];

    const { data, error } = await this.supabase
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh_key, auth_key")
      .in("user_id", userIds)
      .eq("is_active", true);

    if (error) {
      console.error("Failed to get active subscriptions:", error);
      return [];
    }

    return (
      data?.map((record) => ({
        subscription: {
          endpoint: record.endpoint,
          keys: {
            p256dh: record.p256dh_key,
            auth: record.auth_key,
          },
        },
        userId: record.user_id,
      })) ?? []
    );
  }
}
