import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setLanguage } from '../../store/slices/settingsSlice';

const LanguageSelector = ({ compact }) => {
  const dispatch = useDispatch();
  const language = useSelector((s) => s.settings.language);

  const langs = [
    { code: 'en', name: 'EN' },
    { code: 'ta', name: 'TA' },
    { code: 'hi', name: 'HI' },
  ];

  if (compact) {
    return (
      <select
        className="select"
        value={language}
        onChange={(e) => dispatch(setLanguage(e.target.value))}
        id="compact-lang-select"
      >
        {langs.map(({ code, name }) => (
          <option key={code} value={code}>{name}</option>
        ))}
      </select>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {langs.map(({ code, name }) => (
        <button
          key={code}
          className={`btn btn-sm ${language === code ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => dispatch(setLanguage(code))}
        >
          {name}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;