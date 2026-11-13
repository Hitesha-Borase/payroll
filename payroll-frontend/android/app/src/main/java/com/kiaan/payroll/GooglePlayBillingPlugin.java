package com.kiaan.payroll;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.ProductDetailsResponseListener;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesResponseListener;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * GooglePlayBillingPlugin — Capacitor Native Plugin for Google Play Billing Library 9.1.0
 */
@CapacitorPlugin(name = "GooglePlayBilling")
public class GooglePlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private BillingClient billingClient;
    private boolean isClientReady = false;
    private final Map<String, ProductDetails> cachedProductDetails = new HashMap<>();
    private PluginCall activePurchaseCall = null;

    @Override
    public void load() {
        super.load();
        initBillingClient();
    }

    private void initBillingClient() {
        try {
            PendingPurchasesParams pendingParams = PendingPurchasesParams.newBuilder()
                    .enableOneTimeProducts()
                    .enablePrepaidPlans()
                    .build();

            billingClient = BillingClient.newBuilder(getContext())
                    .setListener(this)
                    .enablePendingPurchases(pendingParams)
                    .build();

            connectBillingClient(null);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void connectBillingClient(@Nullable final Runnable onConnected) {
        if (billingClient == null) return;

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    isClientReady = true;
                    if (onConnected != null) {
                        onConnected.run();
                    }
                } else {
                    isClientReady = false;
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                isClientReady = false;
            }
        });
    }

    private void ensureReady(final Runnable action, final PluginCall call) {
        if (billingClient != null && isClientReady && billingClient.isReady()) {
            action.run();
        } else {
            connectBillingClient(() -> {
                if (isClientReady) {
                    action.run();
                } else {
                    if (call != null) {
                        call.reject("Google Play Billing client failed to connect.");
                    }
                }
            });
        }
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", true);
        ret.put("ready", isClientReady && billingClient != null && billingClient.isReady());
        ret.put("libraryVersion", "9.1.0");
        call.resolve(ret);
    }

    @PluginMethod
    public void queryProductDetails(PluginCall call) {
        ensureReady(() -> {
            List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
            productList.add(
                    QueryProductDetailsParams.Product.newBuilder()
                            .setProductId("payroll_plan_starter")
                            .setProductType(BillingClient.ProductType.SUBS)
                            .build()
            );
            productList.add(
                    QueryProductDetailsParams.Product.newBuilder()
                            .setProductId("payroll_plan_pro")
                            .setProductType(BillingClient.ProductType.SUBS)
                            .build()
            );
            productList.add(
                    QueryProductDetailsParams.Product.newBuilder()
                            .setProductId("payroll_plan_premium")
                            .setProductType(BillingClient.ProductType.SUBS)
                            .build()
            );

            QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                    .setProductList(productList)
                    .build();

            billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsResult) -> {
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    call.reject("Failed to query product details: " + billingResult.getDebugMessage());
                    return;
                }

                List<ProductDetails> productDetailsList = productDetailsResult != null ? productDetailsResult.getProductDetailsList() : null;
                if (productDetailsList == null) {
                    call.reject("Failed to query product details: null result list");
                    return;
                }

                JSArray items = new JSArray();
                cachedProductDetails.clear();

                for (ProductDetails details : productDetailsList) {
                    cachedProductDetails.put(details.getProductId(), details);

                    JSObject p = new JSObject();
                    p.put("productId", details.getProductId());
                    p.put("title", details.getTitle());
                    p.put("description", details.getDescription());

                    JSArray offers = new JSArray();
                    List<ProductDetails.SubscriptionOfferDetails> subsOffers = details.getSubscriptionOfferDetails();
                    if (subsOffers != null) {
                        for (ProductDetails.SubscriptionOfferDetails offer : subsOffers) {
                            JSObject offObj = new JSObject();
                            offObj.put("basePlanId", offer.getBasePlanId());
                            offObj.put("offerId", offer.getOfferId());
                            offObj.put("offerToken", offer.getOfferToken());

                            List<ProductDetails.PricingPhase> phases = offer.getPricingPhases().getPricingPhaseList();
                            if (!phases.isEmpty()) {
                                ProductDetails.PricingPhase firstPhase = phases.get(0);
                                offObj.put("formattedPrice", firstPhase.getFormattedPrice());
                                offObj.put("priceCurrencyCode", firstPhase.getPriceCurrencyCode());
                                offObj.put("priceAmountMicros", firstPhase.getPriceAmountMicros());
                                offObj.put("billingPeriod", firstPhase.getBillingPeriod());
                            }
                            offers.put(offObj);
                        }
                    }
                    p.put("offers", offers);
                    items.put(p);
                }

                JSObject result = new JSObject();
                result.put("products", items);
                call.resolve(result);
            });
        }, call);
    }

    @PluginMethod
    public void launchPurchaseFlow(PluginCall call) {
        String productId = call.getString("productId");
        String basePlanId = call.getString("basePlanId");

        if (productId == null || productId.isEmpty()) {
            call.reject("Product ID is required.");
            return;
        }

        ensureReady(() -> {
            ProductDetails details = cachedProductDetails.get(productId);
            if (details == null) {
                queryProductDetailsAndLaunch(productId, basePlanId, call);
                return;
            }

            launchFlowWithDetails(details, basePlanId, call);
        }, call);
    }

    private void queryProductDetailsAndLaunch(String productId, String basePlanId, PluginCall call) {
        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        productList.add(
                QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(productId)
                        .setProductType(BillingClient.ProductType.SUBS)
                        .build()
        );

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsResult) -> {
            List<ProductDetails> productDetailsList = productDetailsResult != null ? productDetailsResult.getProductDetailsList() : null;
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK || productDetailsList == null || productDetailsList.isEmpty()) {
                call.reject("Could not find product details for: " + productId);
                return;
            }

            ProductDetails details = productDetailsList.get(0);
            cachedProductDetails.put(productId, details);
            launchFlowWithDetails(details, basePlanId, call);
        });
    }

    private void launchFlowWithDetails(ProductDetails details, String basePlanId, PluginCall call) {
        List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
        if (offers == null || offers.isEmpty()) {
            call.reject("No subscription offers found for product: " + details.getProductId());
            return;
        }

        ProductDetails.SubscriptionOfferDetails selectedOffer = offers.get(0);
        if (basePlanId != null && !basePlanId.isEmpty()) {
            for (ProductDetails.SubscriptionOfferDetails offer : offers) {
                if (basePlanId.equals(offer.getBasePlanId())) {
                    selectedOffer = offer;
                    break;
                }
            }
        }

        List<BillingFlowParams.ProductDetailsParams> productDetailsParamsList = new ArrayList<>();
        productDetailsParamsList.add(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(details)
                        .setOfferToken(selectedOffer.getOfferToken())
                        .build()
        );

        BillingFlowParams.Builder billingFlowParamsBuilder = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(productDetailsParamsList);

        String oldPurchaseToken = call.getString("oldPurchaseToken");
        if (oldPurchaseToken != null && !oldPurchaseToken.trim().isEmpty()) {
            BillingFlowParams.SubscriptionUpdateParams.Builder subUpdateBuilder =
                    BillingFlowParams.SubscriptionUpdateParams.newBuilder()
                            .setOldPurchaseToken(oldPurchaseToken);

            int replacementMode = call.getInt("replacementMode",
                    BillingFlowParams.SubscriptionUpdateParams.ReplacementMode.CHARGE_PRORATED_PRICE);
            subUpdateBuilder.setSubscriptionReplacementMode(replacementMode);
            billingFlowParamsBuilder.setSubscriptionUpdateParams(subUpdateBuilder.build());
        }

        BillingFlowParams billingFlowParams = billingFlowParamsBuilder.build();

        activePurchaseCall = call;

        if (getActivity() != null) {
            billingClient.launchBillingFlow(getActivity(), billingFlowParams);
        } else {
            call.reject("Activity unavailable to launch Google Play billing flow.");
        }
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billingResult, @Nullable List<Purchase> purchases) {
        if (activePurchaseCall == null) return;

        int responseCode = billingResult.getResponseCode();
        if (responseCode == BillingClient.BillingResponseCode.OK && purchases != null && !purchases.isEmpty()) {
            Purchase purchase = purchases.get(0);
            int purchaseState = purchase.getPurchaseState();
            boolean isPending = (purchaseState == Purchase.PurchaseState.PENDING);

            JSObject res = new JSObject();
            res.put("success", true);
            res.put("orderId", purchase.getOrderId());
            res.put("purchaseToken", purchase.getPurchaseToken());
            res.put("purchaseTime", purchase.getPurchaseTime());
            res.put("purchaseState", purchaseState);
            res.put("isPending", isPending);
            res.put("isAcknowledged", purchase.isAcknowledged());
            res.put("products", new JSArray(purchase.getProducts()));

            activePurchaseCall.resolve(res);
            activePurchaseCall = null;
        } else if (responseCode == BillingClient.BillingResponseCode.USER_CANCELED) {
            activePurchaseCall.reject("Purchase was canceled by the user.", "USER_CANCELED");
            activePurchaseCall = null;
        } else if (responseCode == BillingClient.BillingResponseCode.BILLING_UNAVAILABLE) {
            activePurchaseCall.reject("Google Play Store is unavailable or blocked on this device.", "BILLING_UNAVAILABLE");
            activePurchaseCall = null;
        } else {
            activePurchaseCall.reject("Purchase failed with error code: " + responseCode + " - " + billingResult.getDebugMessage());
            activePurchaseCall = null;
        }
    }

    @PluginMethod
    public void queryPurchases(PluginCall call) {
        ensureReady(() -> {
            QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                    .setProductType(BillingClient.ProductType.SUBS)
                    .build();

            billingClient.queryPurchasesAsync(params, (billingResult, purchases) -> {
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    call.reject("Failed to query purchases: " + billingResult.getDebugMessage());
                    return;
                }

                JSArray items = new JSArray();
                for (Purchase p : purchases) {
                    JSObject obj = new JSObject();
                    obj.put("orderId", p.getOrderId());
                    obj.put("purchaseToken", p.getPurchaseToken());
                    obj.put("purchaseTime", p.getPurchaseTime());
                    obj.put("purchaseState", p.getPurchaseState());
                    obj.put("isAcknowledged", p.isAcknowledged());
                    obj.put("products", new JSArray(p.getProducts()));
                    items.put(obj);
                }

                JSObject res = new JSObject();
                res.put("purchases", items);
                call.resolve(res);
            });
        }, call);
    }

    @PluginMethod
    public void acknowledgePurchase(PluginCall call) {
        String purchaseToken = call.getString("purchaseToken");
        if (purchaseToken == null || purchaseToken.isEmpty()) {
            call.reject("Purchase token is required.");
            return;
        }

        ensureReady(() -> {
            AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(purchaseToken)
                    .build();

            billingClient.acknowledgePurchase(params, billingResult -> {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    JSObject res = new JSObject();
                    res.put("acknowledged", true);
                    call.resolve(res);
                } else {
                    call.reject("Acknowledgement failed: " + billingResult.getDebugMessage());
                }
            });
        }, call);
    }
}
