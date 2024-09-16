import React from "react";
import {Token} from '@solana/spl-token';
import './Link.css';
function OpenLinkButton({ url, text, open, setLink}) {
    const openInNewTab = () => {
        setLink(false)
      window.open(url, '_blank', 'noopener,noreferrer');
    };
  
    return (
      <button onClick={openInNewTab} disabled={!open}
        className={!open?"blue":""}
      >
        {open?text:"Not have transaction"}
      </button>
    );
  }
  export default OpenLinkButton;