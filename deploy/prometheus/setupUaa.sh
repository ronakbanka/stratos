
UAAC=uaac.ruby2.1

$UAAC target --skip-ssl-validation https://uaa.cf-dev.io:2793
$UAAC token client get admin -s admin_secret
$UAAC -t curl -k -H"X-Identity-Zone-Id:cf" -XPOST -H"Content-Type:application/json" -H"Accept:application/json" --data '{ "client_id" : "nu_admin", "client_secret" : "admin_secret", "scope" : ["uaa.none"], "resource_ids" : ["none"], "authorities" : ["uaa.admin","clients.read","clients.write","clients.secret","scim.read","scim.write","clients.admin"], "authorized_grant_types" : ["client_credentials"]}' /oauth/clients
$UAAC target  --skip-ssl-validation https://cf.uaa.cf-dev.io:2793
$UAAC token client get nu_admin -s admin_secret
$UAAC client add prometheus-firehose \
  --name prometheus-firehose \
  --secret prometheus-client-secret \
  --authorized_grant_types client_credentials,refresh_token \
  --authorities doppler.firehose