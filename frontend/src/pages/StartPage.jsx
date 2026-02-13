import { useState } from 'react';

export default function StartPage() {
  const [numRunways, setNumRunways] = useState(3);
  const [inboundFlow, setInboundFlow] = useState(15);
  const [outboundFlow, setOutboundFlow] = useState(15);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,#dce6f0 0%,#c8d8e8 40%,#d4e0ed 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Radial glow behind card */}
      <div
        style={{
          position: 'absolute',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(180,200,220,0.7) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main card */}
      <div
        className="card-glow"
        style={{
          position: 'relative',
          width: '600px',
          height: '500px',
          background: 'linear-gradient(160deg, #7a8da4 0%, #5f7389 30%, #556b82 100%)',
          borderRadius: '16px',
          padding: '40px 48px 36px',
          // remove boxShadow from here — the class handles it now
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Logo pill */}
        <div
          style={{
            background: 'white',
            width: '250px',
            height: '110px',
            borderRadius: '55px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '36px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              fontSize: '38px',
              fontWeight: '400',
              color: '#3a3a3a',
              letterSpacing: '2px',
              lineHeight: '1',
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
          >
            SE
            <span
              style={{
                display: 'inline-block',
                fontSize: '24px',
                color: '#5a6a80',
                transform: 'rotate(-15deg) translateY(-2px)',
                margin: '0 -2px',
              }}
            >
              ✈
            </span>
            P
          </div>
          <div
            style={{
              fontSize: '18px',
              color: '#5a6a80',
              fontStyle: 'italic',
              marginTop: '2px',
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
          >
            Airport Simulation
          </div>
        </div>

        {/* Input rows */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            marginBottom: '32px',
            paddingLeft: '16px',
          }}
        >
          <InputRow
            label="Runways"
            value={numRunways}
            onChange={setNumRunways}
            min={1}
            max={10}
          />
          <InputRow
            label="Inbound Flow (/hr)"
            value={inboundFlow}
            onChange={setInboundFlow}
            min={0}
            max={200}
          />
          <InputRow
            label="Outbound Flow (/hr)"
            value={outboundFlow}
            onChange={setOutboundFlow}
            min={0}
            max={200}
          />
        </div>

        {/* Start button */}
        <button
          style={{
            background: 'linear-gradient(180deg, #f0b84a 0%, #d9a23c 100%)',
            border: '1px solid #c4912e',
            borderRadius: '8px',
            width: '300px',
            padding: '10px 20px',
            fontSize: '15px',
            fontWeight: '600',
            color: '#3a3a3a',
            cursor: 'pointer',
            boxShadow:
              '0 2px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
            transition: 'all 0.15s ease',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              'linear-gradient(180deg, #f5c45a 0%, #e0ad42 100%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              'linear-gradient(180deg, #f0b84a 0%, #d9a23c 100%)';
          }}
        >
          Start Simulation
        </button>
      </div>
    </div>
  );
}

/* ── Input row: white box with native spinner + label to the right ── */
function InputRow({ label, value, onChange, min, max }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '70px',
          height: '32px',
          borderRadius: '6px',
          border: '1px solid #ccc',
          background: 'white',
          padding: '0 8px',
          fontSize: '14px',
          color: '#333',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          outline: 'none',
        }}
      />
      <span
        style={{
          fontSize: '15px',
          color: '#d8dfe8',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: '400',
        }}
      >
        {label}
      </span>
    </div>
  );
}