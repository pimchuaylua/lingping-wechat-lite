// payment.js

(function () {

    const PENDING_PLAN_KEY = "pendingPlanId";

    async function createPayment(subscriptionPlanId) {

        // 0️⃣ If not logged in → remember plan + redirect
        if (!window.Auth.isLoggedIn()) {
            localStorage.setItem(PENDING_PLAN_KEY, subscriptionPlanId);
            window.location.href = "../login.html";
            return;
        }

        const { userId } = window.Auth.getUser();
        const { BASE_URL, API_KEY } = window.CONFIG;

        try {

            const response = await fetch(`${BASE_URL}/payments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-KEY": API_KEY
                },
                body: JSON.stringify({
                    userId,
                    subscriptionPlanId,
                    quantity: 1
                })
            });

            const result = await response.json();

            if (result.status && result.data?.paymentUrl) {

                // clear pending plan
                localStorage.removeItem(PENDING_PLAN_KEY);

                window.location.href = result.data.paymentUrl;
            } else {
                throw new Error(result.message || "Payment failed");
            }

        } catch (error) {
            console.error("Payment error:", error);
            alert("Unable to start payment.");
        }
    }

    // 🔥 Auto-run after login if there is pending plan
    async function checkPendingPayment() {

        const pendingPlanId = localStorage.getItem(PENDING_PLAN_KEY);

        if (pendingPlanId && window.Auth.isLoggedIn()) {
            createPayment(pendingPlanId);
        }
    }

    // expose global
    window.buyPlan = function (planId) {
        createPayment(planId);
    };

    // run on page load
    document.addEventListener("DOMContentLoaded", checkPendingPayment);

})();