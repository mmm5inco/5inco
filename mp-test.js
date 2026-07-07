async function test() {
  const url = 'https://api.mercadopago.com/checkout/preferences';
  const token = 'APP_USR-3832309837184429-070601-2592d0e2cf503247a5ffbeaf5a40df76-510354246';
  
  const body = {
    items: [
      {
        title: 'Suscripcion Mensual',
        quantity: 1,
        unit_price: 45000,
        currency_id: 'ARS'
      }
    ],
    back_urls: {
      success: 'https://5inco.com.ar/test/admin'
    },
    external_reference: 'test-local-id'
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
