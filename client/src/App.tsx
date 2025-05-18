import { useState, useEffect } from 'react'
import axios from 'axios'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

interface TestData {
  message: string;
  timestamp: string;
  data: {
    items: Array<{
      _id: string;
      name: string;
      value: number;
    }>;
    count: number;
  };
}

function App() {
  const [count, setCount] = useState(0)
  const [testData, setTestData] = useState<TestData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/test');
        setTestData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data from server');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      
      <div className="api-data">
        <h2>Server Data</h2>
        {loading && <p>Loading data...</p>}
        {error && <p className="error">{error}</p>}
        {testData && (
          <div>
            <p><strong>Message:</strong> {testData.message}</p>
            <p><strong>Timestamp:</strong> {testData.timestamp}</p>
            <h3>Items:</h3>
            <ul>
              {testData.data.items.map(item => (
                <li key={item._id}>
                  {item.name}: {item.value}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
