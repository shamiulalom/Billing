import React, { useState, useEffect, useRef, useMemo } from "react";
import { FileText, Plus, Trash2, Download, Eye, RotateCcw, Settings } from "lucide-react";
import { ReportHeader, LineItem } from "./types";
import { formatCurrency } from "./utils";
import { calculateTotals, generateReports } from "./services/reportService";
import { RAW_CONTRACT_CSV } from "./data/contractData";
import { RAW_SUPPLIER_CSV } from "./data/supplierData";
import { RAW_FABRIC_CSV } from "./data/fabricData";
import { getSupabase } from "./services/supabase";
import SettingsModal from "./SettingsModal";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Helper to get today's date in DD/MMM/YYYY format
const getTodayDateStr = () => {
  const today = new Date();
  const d = String(today.getDate()).padStart(2, '0');
  const m = months[today.getMonth()];
  const y = today.getFullYear();
  return `${d}/${m}/${y}`;
};

// Factory for a fresh, empty line item
const createBlankItem = (): LineItem => ({
  id: crypto.randomUUID(),
  fabricCode: "",
  itemDescription: "",
  color: "",
  hsCode: "",
  rcvdDate: "",
  challanNo: "",
  piNumber: "",
  unit: "YDS",
  invoiceQty: 0,
  rcvdQty: 0,
  unitPrice: 0,
  appstremeNo: "",
});

/**
 * Custom Smart Input Field with character-count thresholds and compact suggestions.
 */
const SmartInputField: React.FC<{
  label?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectSuggestion?: (name: string, value: string) => void;
  suggestions?: string[];
  threshold?: number;
  required?: boolean;
  bold?: boolean;
  className?: string;
}> = ({ label, name, value, onChange, onSelectSuggestion, suggestions = [], threshold = 1, required, bold, className }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = useMemo(() => {
    if (!value || value.length < threshold) return [];
    const normalized = value.toLowerCase();
    return suggestions
      .filter(s => s.toLowerCase().includes(normalized))
      .slice(0, 12);
  }, [value, suggestions, threshold]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`input-field ${className || ""} ${bold ? "input-bold" : ""}`} ref={containerRef}>
      {label && (
        <label className="input-label">
          {label} {required && <span style={{ color: "var(--danger)" }}>*</span>}
        </label>
      )}
      <input
        type="text"
        name={name}
        value={value || ""}
        onChange={(e) => {
          onChange(e);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        autoComplete="off"
      />
      {showDropdown && filteredSuggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {filteredSuggestions.map((s, idx) => (
            <div
              key={idx}
              className="suggestion-item"
              onClick={() => {
                if (onSelectSuggestion) onSelectSuggestion(name, s);
                setShowDropdown(false);
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SmartDateInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}> = ({ value, onChange, label, required, className }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = () => {
    if (!value) return;
    const parts = value.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      if (year.length === 2) {
        onChange(`${day}/${month}/20${year}`);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const isDelete = (e.nativeEvent as any).inputType?.includes('delete');
    
    if (isDelete) {
      onChange(input);
      return;
    }

    let normalized = input;
    months.forEach((m, idx) => {
      const num = (idx + 1).toString().padStart(2, '0');
      normalized = normalized.replace(new RegExp(m, 'g'), num);
    });

    const clean = normalized.replace(/[^\d]/g, "");
    let dayDigits = clean.slice(0, 2);
    let monthDigits = clean.slice(2, 4);
    let yearDigits = clean.slice(4, 8);

    if (dayDigits.length === 2) {
      const d = parseInt(dayDigits);
      if (d > 31) dayDigits = "31";
      if (d === 0) dayDigits = "01";
    }

    let result = dayDigits;
    if (dayDigits.length === 2) result += "/";

    if (monthDigits.length > 0) {
      if (monthDigits.length === 2) {
        let m = parseInt(monthDigits);
        if (m > 12) m = 12;
        if (m === 0) m = 1;
        result += months[m - 1] + "/";
      } else {
        result += monthDigits;
      }
    }

    if (yearDigits.length > 0) {
      result += yearDigits;
    }

    onChange(result);
  };

  return (
    <div className={`input-field ${className || ""}`}>
      {label && (
        <label className="input-label">
          {label} {required && <span style={{ color: "var(--danger)" }}>*</span>}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        placeholder="DD/MM/YYYY"
        value={value || ""}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={11}
        data-is-date-input="true"
        className="date-input-highlight"
        autoComplete="off"
      />
    </div>
  );
};

const App: React.FC = () => {
  const [header, setHeader] = useState<ReportHeader>({
    buyerName: "",
    supplierName: "",
    fileNo: "",
    invoiceNo: "",
    lcNumber: "",
    invoiceDate: "",
    billingDate: getTodayDateStr(),
  });

  const [items, setItems] = useState<LineItem[]>([createBlankItem()]);
  const [previewMode, setPreviewMode] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [persistentColors, setPersistentColors] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Supabase Data States
  const [supabaseBuyers, setSupabaseBuyers] = useState<{ name: string; file_no: string }[]>([]);
  const [supabaseFabrics, setSupabaseFabrics] = useState<{ code: string; description: string }[]>([]);
  const [supabaseColors, setSupabaseColors] = useState<string[]>([]);
  const [supabaseSuppliers, setSupabaseSuppliers] = useState<{ code: string; name: string }[]>([]);

  // Load persistent colors from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("tusuka_persistent_colors");
    if (saved) {
      try {
        setPersistentColors(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse persistent colors", e);
      }
    }
    fetchSupabaseData();
  }, []);

  const fetchSupabaseData = async () => {
    const sb = getSupabase();
    if (!sb) return;

    try {
      const { data: b } = await sb.from("buyers").select("name, file_no");
      const { data: f } = await sb.from("fabrics").select("code, description");
      const { data: c } = await sb.from("colors").select("name");
      const { data: s } = await sb.from("suppliers").select("code, name");
      
      if (b) setSupabaseBuyers(b);
      if (f) setSupabaseFabrics(f);
      if (c) setSupabaseColors(c.map(item => item.name));
      if (s) setSupabaseSuppliers(s);
    } catch (error) {
      console.error("Error fetching Supabase data:", error);
    }
  };

  // Save a new color to persistent storage
  const saveColorToPersistent = (color: string) => {
    if (!color) return;
    const trimmed = color.trim();
    if (!trimmed) return;
    
    setPersistentColors(prev => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed].sort();
      localStorage.setItem("tusuka_persistent_colors", JSON.stringify(next));
      return next;
    });
  };

  // Parse CSV Data
  const contractLookup = useMemo(() => {
    const map: Record<string, string> = {};
    
    // Add CSV data first
    const lines = RAW_CONTRACT_CSV.split('\n');
    lines.forEach((line, index) => {
      if (index === 0 || !line.trim()) return; 
      const parts = line.split(',');
      if (parts.length >= 2) {
        const contractNo = parts[0].trim();
        const customer = parts[1].trim();
        map[contractNo] = customer;
      }
    });

    // Supabase Buyers override CSV
    supabaseBuyers.forEach(b => {
      if (b.file_no) {
        map[b.file_no] = b.name;
      }
    });

    return map;
  }, [supabaseBuyers]);

  const uniqueBuyers = useMemo(() => {
    const buyers = new Set<string>();
    Object.values(contractLookup).forEach(b => buyers.add(b as string));
    supabaseBuyers.forEach(b => buyers.add(b.name));
    return Array.from(buyers).sort();
  }, [contractLookup, supabaseBuyers]);

  const allContracts = useMemo(() => {
    return Object.keys(contractLookup).sort();
  }, [contractLookup]);

  const supplierLookup = useMemo(() => {
    const map: Record<string, string> = {};
    
    // Add CSV data first
    const lines = RAW_SUPPLIER_CSV.split('\n');
    lines.forEach((line, index) => {
      if (index === 0 || !line.trim()) return;
      const parts = line.split(',');
      if (parts.length >= 2) {
        const code = parts[0].trim();
        const name = parts[1].trim();
        map[code] = name;
      }
    });

    // Supabase Suppliers override CSV
    supabaseSuppliers.forEach(s => {
      map[s.code] = s.name;
    });

    return map;
  }, [supabaseSuppliers]);

  const allSuppliers = useMemo(() => {
    const suppliers = new Set<string>();
    Object.values(supplierLookup).forEach(s => suppliers.add(s as string));
    supabaseSuppliers.forEach(s => suppliers.add(s.name));
    return Array.from(suppliers).sort();
  }, [supplierLookup, supabaseSuppliers]);

  const fabricLookup = useMemo(() => {
    const map: Record<string, string> = {};
    
    // Add CSV data first
    const lines = RAW_FABRIC_CSV.split('\n');
    lines.forEach((line, index) => {
      if (index === 0 || !line.trim()) return;
      const parts = line.split(',');
      if (parts.length >= 2) {
        const code = parts[0].trim();
        const desc = parts[1].trim();
        map[code] = desc;
      }
    });

    // Supabase Fabrics override CSV
    supabaseFabrics.forEach(f => {
      map[f.code] = f.description;
    });

    return map;
  }, [supabaseFabrics]);

  const allFabricCodes = useMemo(() => {
    return Object.keys(fabricLookup).sort();
  }, [fabricLookup]);

  // Collect all unique colors from current items AND persistent storage for suggestions
  const allColors = useMemo(() => {
    const currentColors = items.map(item => item.color).filter(Boolean);
    const combined = Array.from(new Set([...currentColors, ...persistentColors, ...supabaseColors])).sort();
    return combined;
  }, [items, persistentColors, supabaseColors]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const target = e.target as HTMLInputElement;
        if (target.getAttribute("data-is-date-input") === "true") {
          if (target.value.length > 0 && target.value.length < 10) {
            e.preventDefault();
            return;
          }
        }
        if (target.tagName === "INPUT" || target.tagName === "SELECT") {
          e.preventDefault();
          const formElements = Array.from(
            document.querySelectorAll('input:not([type="hidden"]), select, button:not([disabled])')
          ) as HTMLElement[];
          const index = formElements.indexOf(target);
          if (index > -1 && index < formElements.length - 1) {
            formElements[index + 1].focus();
          }
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const updateHeaderField = (name: string, value: string) => {
    setHeader((prev) => {
      let nextValue = value;
      let matchedBuyer = "";
      let matchedSupplier = "";

      if (name === "fileNo") {
        const trimmed = value.trim();
        if (/^\d{1,4}$/.test(trimmed)) {
          const autoPrefixed = `TTL-${trimmed}`;
          if (contractLookup[autoPrefixed]) {
            nextValue = autoPrefixed;
            matchedBuyer = contractLookup[autoPrefixed];
          }
        } else {
          const uppercaseVal = trimmed.toUpperCase();
          matchedBuyer = contractLookup[trimmed] || contractLookup[uppercaseVal];
        }
      }

      if (name === "supplierName") {
        const trimmed = value.trim();
        const uppercaseVal = trimmed.toUpperCase();
        matchedSupplier = supplierLookup[trimmed] || supplierLookup[uppercaseVal];
        if (matchedSupplier) {
          nextValue = matchedSupplier;
        }
      }

      const nextHeader = { ...prev, [name]: nextValue };
      if (name === "fileNo" && matchedBuyer && !prev.buyerName) {
        nextHeader.buyerName = matchedBuyer;
      }
      return nextHeader;
    });
  };

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateHeaderField(name, value);
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    setItems((prev) => prev.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Automation: If fabricCode is changed, try to find matching description
        if (field === "fabricCode") {
          const trimmed = value.trim();
          const matchedDesc = fabricLookup[trimmed] || fabricLookup[trimmed.toUpperCase()];
          if (matchedDesc && !item.itemDescription) {
            updatedItem.itemDescription = matchedDesc;
          }
        }

        // Automation: If invoiceQty is changed, auto-fill rcvdQty
        if (field === "invoiceQty") {
          updatedItem.rcvdQty = value;
        }

        // Save color to persistent storage if it's a new color
        if (field === "color" && value) {
          // We don't save on every keystroke to avoid cluttering, 
          // but we can save it when it's selected or when the user moves away.
          // For now, let's just ensure it's available for the next time.
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const addNewRow = () => {
    setItems((prev) => [...prev, createBlankItem()]);
  };

  const removeRow = (id: string) => {
    if (items.length > 1) setItems((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * RE-IMPLEMENTED CLEAR ALL (FIXED REAL-CASE LOGIC):
   * This function forces a fresh state by creating brand-new objects and IDs.
   * Also uses resetKey to force a complete re-mount of input components.
   * Confirmation popup removed for immediate reset.
   */
  const clearAll = () => {
    // 1. Reset Header explicitly
    const today = getTodayDateStr();
    setHeader({
      buyerName: "",
      supplierName: "",
      fileNo: "",
      invoiceNo: "",
      lcNumber: "",
      invoiceDate: "",
      billingDate: today,
    });

    // 2. Reset Items with a completely NEW UUID to force input re-render
    setItems([{
      id: crypto.randomUUID(),
      fabricCode: "",
      itemDescription: "",
      color: "",
      hsCode: "",
      rcvdDate: "",
      challanNo: "",
      piNumber: "",
      unit: "YDS",
      invoiceQty: 0,
      rcvdQty: 0,
      unitPrice: 0,
      appstremeNo: "",
    }]);
    
    // 3. Reset Preview State
    setPreviewMode(false);

    // 4. Force UI Refresh of all inputs
    setResetKey(prev => prev + 1);
  };

  const handleGenerate = async () => {
    if (!header.buyerName.trim()) return alert("⚠️ Please enter a Buyer Name.");
    if (!header.billingDate || header.billingDate.length < 8) return alert("⚠️ Please enter a valid billing date.");
    
    // Save all current colors to persistent storage before generating
    items.forEach(item => {
      if (item.color) saveColorToPersistent(item.color);
    });

    try {
      await generateReports(header, items);
    } catch (error) {
      alert("❌ Error generating reports.");
    }
  };

  const totals = calculateTotals(items);
  const hasQtyMismatch = Math.abs(totals.totalInvoiceQty - totals.totalRcvdQty) > 0.001;

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-top">
          <div className="header-title">
            <div className="header-logo">📊</div>
            <span>Bill Of Exchange Report Generator</span>
          </div>
          <button 
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
            onClick={() => setIsSettingsOpen(true)}
            title="Management Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onDataChange={fetchSupabaseData}
      />

      <div className="content-wrapper">
        <div className="main-panel">
          <div className="form-section" key={resetKey}>
            <div className="bill-info-header">
              <FileText size={18} />
              <span>Bill Information</span>
            </div>

            <div className="bill-info-container">
              <div className="bill-info-left">
                <div className="row-30-70">
                  <SmartInputField 
                    label="Buyer Name" 
                    name="buyerName" 
                    value={header.buyerName} 
                    onChange={handleHeaderChange} 
                    onSelectSuggestion={updateHeaderField}
                    suggestions={uniqueBuyers}
                    threshold={1}
                    required 
                    bold 
                  />
                  <SmartInputField 
                    label="Supplier Name" 
                    name="supplierName" 
                    value={header.supplierName} 
                    onChange={handleHeaderChange} 
                    onSelectSuggestion={updateHeaderField}
                    suggestions={allSuppliers}
                    threshold={1} 
                  />
                </div>
                <div className="row-30-70">
                  <SmartInputField 
                    label="File No" 
                    name="fileNo" 
                    value={header.fileNo} 
                    onChange={handleHeaderChange} 
                    onSelectSuggestion={updateHeaderField}
                    suggestions={allContracts}
                    threshold={3} 
                  />
                  <div className="input-field">
                    <label className="input-label">Invoice No</label>
                    <input 
                      type="text" 
                      name="invoiceNo" 
                      value={header.invoiceNo || ""} 
                      onChange={handleHeaderChange}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>

              <div className="bill-info-right">
                <div className="input-field lc-highlight">
                  <label className="input-label">L/C Number</label>
                  <input 
                    type="text" 
                    name="lcNumber" 
                    value={header.lcNumber || ""} 
                    onChange={handleHeaderChange}
                    autoComplete="off"
                  />
                </div>
                <div className="row-50-50">
                  <SmartDateInput label="Invoice Date" value={header.invoiceDate} onChange={(val) => setHeader(p => ({ ...p, invoiceDate: val }))} />
                  <SmartDateInput label="Billing Date" value={header.billingDate} onChange={(val) => setHeader(p => ({ ...p, billingDate: val }))} required />
                </div>
              </div>
            </div>
          </div>

          <div className="table-section">
            <div className="table-header">
              <div className="table-title">Line Items ({items.length})</div>
              <div className="table-controls">
                {!previewMode && (
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ backgroundColor: '#fff', border: '1px solid #fee2e2', color: '#dc2626' }} 
                    onClick={clearAll}
                  >
                    <RotateCcw size={16} />
                    Clear All
                  </button>
                )}
                <button className="btn btn-secondary btn-sm" onClick={() => setPreviewMode(!previewMode)}>
                  <Eye size={16} />
                  {previewMode ? "Edit" : "Preview"}
                </button>
                <button className="btn btn-primary btn-sm" onClick={addNewRow}>
                  <Plus size={16} />
                  Add Row
                </button>
              </div>
            </div>
            <div className="table-wrapper">
              <table key={`table-${resetKey}`}>
                <thead>
                  <tr>
                    <th style={{ minWidth: "220px" }}>Code & Description</th>
                    <th style={{ minWidth: "120px" }}>Color</th>
                    <th style={{ minWidth: "140px" }}>Received Date</th>
                    <th style={{ minWidth: "160px" }}>Challan & PI</th>
                    <th style={{ minWidth: "120px" }}>Quantity</th>
                    {/* Unit moved here, after Quantities */}
                    <th style={{ minWidth: "100px" }}>Unit</th> 
                    <th style={{ minWidth: "100px" }}>Price ($)</th>
                    <th style={{ minWidth: "100px" }}>Total ($)</th>
                    <th style={{ minWidth: "100px" }}>Appstreme</th>
                    <th style={{ minWidth: "40px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {previewMode ? <div>{item.fabricCode}<br/>{item.itemDescription}</div> : (
                          <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                            <SmartInputField 
                              name="fabricCode"
                              value={item.fabricCode || ""} 
                              onChange={e => handleItemChange(item.id, 'fabricCode', e.target.value)} 
                              onSelectSuggestion={(name, val) => handleItemChange(item.id, 'fabricCode', val)}
                              suggestions={allFabricCodes}
                              threshold={1}
                            />
                            <input type="text" value={item.itemDescription || ""} onChange={e => handleItemChange(item.id, 'itemDescription', e.target.value)} placeholder="Description" autoComplete="off" />
                          </div>
                        )}
                      </td>
                      <td>
                        {previewMode ? <div>{item.color}</div> : (
                          <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                            <SmartInputField 
                              name="color"
                              value={item.color || ""} 
                              onChange={e => handleItemChange(item.id, 'color', e.target.value)} 
                              onSelectSuggestion={(name, val) => {
                                handleItemChange(item.id, 'color', val);
                                saveColorToPersistent(val);
                              }}
                              suggestions={allColors}
                              threshold={1}
                              placeholder="Color"
                            />
                          </div>
                        )}
                      </td>
                      <td>
                        {previewMode ? <span>{item.rcvdDate}</span> : <SmartDateInput value={item.rcvdDate} onChange={val => handleItemChange(item.id, 'rcvdDate', val)} />}
                      </td>
                      <td>
                        {previewMode ? <div>{item.challanNo}<br/>{item.piNumber}</div> : (
                          <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                            <input type="text" value={item.challanNo || ""} onChange={e => handleItemChange(item.id, 'challanNo', e.target.value)} placeholder="Challan" autoComplete="off" />
                            <input type="text" value={item.piNumber || ""} onChange={e => handleItemChange(item.id, 'piNumber', e.target.value)} placeholder="PI" autoComplete="off" />
                          </div>
                        )}
                      </td>
                      <td>
                        {previewMode ? <div>Qty: {item.invoiceQty}</div> : (
                          <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                            <input 
                              type="number" 
                              value={item.invoiceQty === 0 ? "" : item.invoiceQty} 
                              onChange={e => handleItemChange(item.id, 'invoiceQty', parseFloat(e.target.value)||0)} 
                              placeholder="Quantity" 
                              autoComplete="off"
                            />
                          </div>
                        )}
                      </td>
                      {/* Unit Data moved here */}
                      <td>
                        {previewMode ? <span>{item.unit}</span> : (
                          <select value={item.unit} onChange={e => handleItemChange(item.id, 'unit', e.target.value)}>
                            <option>YDS</option><option>PCS</option><option>KG</option><option>MTR</option><option>BOX</option>
                          </select>
                        )}
                      </td>
                      <td>
                        {previewMode ? <span>${item.unitPrice}</span> : (
                          <input 
                            type="number" 
                            value={item.unitPrice === 0 ? "" : item.unitPrice} 
                            onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value)||0)} 
                            step="0.01" 
                            placeholder="Price"
                            autoComplete="off"
                          />
                        )}
                      </td>
                      <td style={{textAlign:'right'}}><strong>${(item.invoiceQty * item.unitPrice).toFixed(2)}</strong></td>
                      <td>
                        {previewMode ? <span>{item.appstremeNo}</span> : (
                          <input type="text" value={item.appstremeNo || ""} onChange={e => handleItemChange(item.id, 'appstremeNo', e.target.value)} placeholder="Receipt No" autoComplete="off" />
                        )}
                      </td>
                      <td>{!previewMode && <button className="btn btn-danger btn-sm" onClick={() => removeRow(item.id)} disabled={items.length===1}><Trash2 size={14}/></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <div className="footer-summary">
          <div className="footer-summary-item">
            <div className="footer-summary-label">Buyer Name</div>
            <div className="footer-summary-value">{header.buyerName || "None"}</div>
          </div>
          <div className={`footer-summary-item ${hasQtyMismatch ? "qty-mismatch" : ""}`}>
            <div className="footer-summary-label">Invoice Qty</div>
            <div className="footer-summary-value">{totals.totalInvoiceQty.toFixed(2)}</div>
          </div>
          <div className={`footer-summary-item ${hasQtyMismatch ? "qty-mismatch" : ""}`}>
            <div className="footer-summary-label">Received Qty</div>
            <div className="footer-summary-value">{totals.totalRcvdQty.toFixed(2)}</div>
          </div>
          <div className="footer-summary-item">
            <div className="footer-summary-label">Total Value</div>
            <div className="footer-summary-value">{formatCurrency(totals.totalValue)}</div>
          </div>
        </div>
        <div className="footer-actions">
          <button className="btn btn-success" onClick={handleGenerate}>
            <Download size={18} />
            Generate Report (PDF & Excel)
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;