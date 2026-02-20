define([
    'jquery',
    'uiComponent',
    'ko',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/action/set-shipping-information',
    'Avarda_MarkupShippingSuiteCompatible/js/view/checkout/shipping/agent-valid',
    'uiRegistry',
], function (
    $,
    Component,
    ko,
    quote,
    setShippingInformationAction,
    agentValid,
    uiRegistry,
) {
    'use strict';

    return Component.extend({
        shippingSuiteComponent: null,
        saving: false,

        initialize: function () {
            this._super();
            let self = this;

            quote.shippingMethod.subscribe(function (method) {
                // Skip validation during save cycle to avoid race condition:
                // setShippingInformationAction refreshes rates, which re-triggers
                // this subscription while agents are reloading
                if (self.saving) {
                    return;
                }

                let suite = self.getShippingSuiteAgent();
                if (method && suite && suite.agentsAvailable()) {
                    agentValid(!suite.agentNotSet());
                } else {
                    agentValid(true);
                }
            });

            // Set subscription to agent selection after shipping methods are first time set
            let initial = quote.shippingMethod.subscribe(function () {
                // If agent component is not available, this is too early to run yet
                if (!self.getShippingSuiteAgent()) {
                    return false;
                }

                self.getShippingSuiteAgent().selectedAgentId.subscribe(function (agentId) {
                    var agent = self.getShippingSuiteAgent().findAgentById(agentId);
                    if (agent != false) {
                        agentValid(true);
                        // ShippingSuite does not trigger save on agent selection,
                        // so we need to save shipping information here
                        self.saving = true;
                        setShippingInformationAction().always(function () {
                            self.saving = false;
                        });
                    } else {
                        agentValid(false);
                    }
                });

                initial.dispose();
            });
        },
        getShippingSuiteAgent: function () {
            if (this.shippingSuiteComponent === null) {
                this.shippingSuiteComponent = this.getSiblingComponent('checkout.steps.avarda-shipping.shippingAdditional.markup_shipping_suite_agent_search');
            }
            return this.shippingSuiteComponent;
        },
        getSiblingComponent: function(name) {
            let component = uiRegistry.get(name);
            return component;
        }
    });
});
