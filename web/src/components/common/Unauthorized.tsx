import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
    const navigate = useNavigate();

    return (
        <div className="unauthorized-container">
            <div className="unauthorized-content">
                <div className="unauthorized-icon">🔒</div>
                <h1>Access Denied</h1>
                <p>You don't have permission to access this page.</p>
                <p className="unauthorized-hint">
                    Please contact your administrator if you believe this is an error.
                </p>
                <div className="unauthorized-actions">
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/dashboard')}
                    >
                        Go to Dashboard
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => navigate(-1)}
                    >
                        Go Back
                    </button>
                </div>
            </div>

            <style>{`
        .unauthorized-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          padding: 2rem;
        }

        .unauthorized-content {
          text-align: center;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 3rem;
          max-width: 450px;
          animation: fadeInUp 0.5s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .unauthorized-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
        }

        .unauthorized-content h1 {
          color: #fff;
          font-size: 2rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .unauthorized-content p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1rem;
          margin: 0 0 0.5rem 0;
        }

        .unauthorized-hint {
          font-size: 0.875rem !important;
          color: rgba(255, 255, 255, 0.5) !important;
          margin-bottom: 2rem !important;
        }

        .unauthorized-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
        </div>
    );
}
