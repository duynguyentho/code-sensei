export const parseJSONResponse = (response: string): any => {
  response = parseTextResponse(response);
  return JSON.parse(response.trim());
}

export const parseTextResponse = (response: string): string => {
  // ignore the first line if it ends with a colon
  response = response.trim();
  if (response.split('\n')[0].endsWith(':')) {
    response = response.split('\n').slice(1).join('\n').trim();
  }

  return response;
}
