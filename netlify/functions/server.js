exports.handler = async function(event, context) {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Test response
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: "Burg Hochosterwitz API",
      path: event.path,
      method: event.httpMethod
    })
  };
};
