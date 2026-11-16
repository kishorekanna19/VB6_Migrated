import { Link } from 'react-router-dom';

/** Shown after Exit (the VB `End` statement); the browser tab cannot always be closed by script. */
export default function GoodbyePage() {
  return (
    <div className="splash">
      <h1 className="splash-title">Kora Kagaz</h1>
      <p>Goodbye! The session has ended. You can close this window.</p>
      <p>
        <Link to="/login">Sign in again</Link>
      </p>
    </div>
  );
}
