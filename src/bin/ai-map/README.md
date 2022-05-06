## fillMissingData script

To run this script, you need a valid Bing Search resource and associated API key.

To set up a Bing Search resource you need an azure account and a subscription
(the subscription can be a free tier one and you can use this script using the
free tier Bing Search service too). Once you have a subscription, navigate
to the subscription resource page and click on "Resource providers". There,
you'll see a list of services. Make sure "Microsoft.Bing" is registered, as if
you don't, no pricing tiers appear when creating the Bing Search service.

Once the service has been registered, you can create a Bing Search service and
obtain the neccessary API keys. Export this key to an environment variable
named AZURE_SUBSCRIPTION_KEY and you should be able to run the script directly.