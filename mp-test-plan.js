async function test() {
  const url = 'https://api.mercadopago.com/preapproval_plan';
  const token = 'APP_USR-3832309837184429-070601-2592d0e2cf503247a5ffbeaf5a40df76-510354246';
  
  const body = {
    reason: 'Suscripcion 5inco - Local test-local-id',
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: 45000,
      currency_id: 'ARS'
    },
    back_url: 'https://5inco.com.ar/test/admin',
    external_reference: 'test-local-id',
    notification_url: 'https://5inco.com.ar/api/mercadopago/webhook'
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  console.log('Status:', response.status);
  console.log('Response:', text);
}

test();
