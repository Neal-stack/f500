import axios from 'axios';

// Finnhub API to get earnings events
export async function getEarningsData() {
  const url = `https://finnhub.io/api/v1/calendar/earnings?from=2024-01-01&to=2024-12-31&token=Ycs7unqpr01qsceftfvpgcs7unqpr01qsceftfvq0`;
  const response = await axios.get(url);
  return response.data.earnings;
}