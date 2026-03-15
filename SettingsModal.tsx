import React, { useState, useEffect } from "react";
import { X, Save, Trash2, Lock, Settings, Search, CloudUpload, Edit2, FileUp, LayoutDashboard, Download, FileSpreadsheet, FileText as PdfIcon } from "lucide-react";
import { getSupabase } from "./services/supabase";
import { RAW_CONTRACT_CSV } from "./data/contractData";
import { RAW_FABRIC_CSV } from "./data/fabricData";
import { RAW_SUPPLIER_CSV } from "./data/supplierData";
import { generatePDF, generateExcel, calculateTotals } from "./services/reportService";
import { getFilenameDate } from "./utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChange: () => void;
  onLoadReport: (report: any) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onDataChange, onLoadReport }) => {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"buyers" | "fabrics" | "colors" | "suppliers" | "dashboard">("buyers");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPushing, setIsPushing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{
    buyers: boolean;
    fabrics: boolean;
    suppliers: boolean;
  }>({ buyers: false, fabrics: false, suppliers: false });
  
  const [buyers, setBuyers] = useState<{ id: string; name: string; file_no: string }[]>([]);
  const [fabrics, setFabrics] = useState<{ id: string; code: string; description: string }[]>([]);
  const [colors, setColors] = useState<{ id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; code: string; name: string }[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  
  const [newBuyer, setNewBuyer] = useState({ name: "", file_no: "" });
  const [newFabric, setNewFabric] = useState({ code: "", description: "" });
  const [newColor, setNewColor] = useState("");
  const [newSupplier, setNewSupplier] = useState({ code: "", name: "" });

  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      checkSyncStatus();
    }
  }, [isAuthenticated, activeTab]);

  const checkSyncStatus = async () => {
    const sb = getSupabase();
    if (!sb) return;

    try {
      const [{ count: bCount }, { count: fCount }, { count: sCount }] = await Promise.all([
        sb.from("buyers").select("*", { count: 'exact', head: true }),
        sb.from("fabrics").select("*", { count: 'exact', head: true }),
        sb.from("suppliers").select("*", { count: 'exact', head: true })
      ]);

      setSyncStatus({
        buyers: (bCount || 0) > 0,
        fabrics: (fCount || 0) > 0,
        suppliers: (sCount || 0) > 0
      });
    } catch (err) {
      console.error("Sync status check failed:", err);
    }
  };

  const fetchData = async () => {
    const sb = getSupabase();
    if (!sb) return;

    if (activeTab === "buyers") {
      const { data } = await sb.from("buyers").select("*").order("name");
      setBuyers(data || []);
    } else if (activeTab === "fabrics") {
      const { data } = await sb.from("fabrics").select("*").order("code");
      setFabrics(data || []);
    } else if (activeTab === "colors") {
      const { data } = await sb.from("colors").select("*").order("name");
      setColors(data || []);
    } else if (activeTab === "suppliers") {
      const { data } = await sb.from("suppliers").select("*").order("name");
      setSuppliers(data || []);
    } else if (activeTab === "dashboard") {
      const { data } = await sb.from("reports").select("*").order("updated_at", { ascending: false });
      setReports(data || []);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === adminPassword) {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  const addItem = async () => {
    const sb = getSupabase();
    if (!sb) return alert("Supabase is not configured. Please check environment variables.");

    try {
      if (activeTab === "buyers") {
        if (!newBuyer.name) return;
        const { error } = editingId 
          ? await sb.from("buyers").update(newBuyer).eq("id", editingId)
          : await sb.from("buyers").insert([newBuyer]);
        if (error) throw error;
        setNewBuyer({ name: "", file_no: "" });
      } else if (activeTab === "fabrics") {
        if (!newFabric.code) return;
        const { error } = editingId
          ? await sb.from("fabrics").update(newFabric).eq("id", editingId)
          : await sb.from("fabrics").insert([newFabric]);
        if (error) throw error;
        setNewFabric({ code: "", description: "" });
      } else if (activeTab === "colors") {
        if (!newColor) return;
        const { error } = editingId
          ? await sb.from("colors").update({ name: newColor }).eq("id", editingId)
          : await sb.from("colors").insert([{ name: newColor }]);
        if (error) throw error;
        setNewColor("");
      } else if (activeTab === "suppliers") {
        if (!newSupplier.code || !newSupplier.name) return;
        const { error } = editingId
          ? await sb.from("suppliers").update(newSupplier).eq("id", editingId)
          : await sb.from("suppliers").insert([newSupplier]);
        if (error) throw error;
        setNewSupplier({ code: "", name: "" });
      }
      
      setEditingId(null);
      fetchData();
      onDataChange();
    } catch (error: any) {
      console.error("Save error:", error);
      alert(`Error saving data: ${error.message}`);
    }
  };

  const deleteItem = async (id: string) => {
    const sb = getSupabase();
    if (!sb) return;

    if (confirm("Are you sure you want to delete this?")) {
      try {
        const table = activeTab === "dashboard" ? "reports" : activeTab;
        const { error } = await sb.from(table).delete().eq("id", id);
        if (error) throw error;
        fetchData();
        onDataChange();
      } catch (error: any) {
        console.error("Delete error:", error);
        alert(`Error deleting item: ${error.message}`);
      }
    }
  };

  const pushInitialData = async () => {
    const sb = getSupabase();
    if (!sb) return alert("Supabase is not configured.");
    
    if (!confirm("This will push all hardcoded CSV data to Supabase. Continue?")) return;
    
    setIsPushing(true);
    console.log("Starting data push to Supabase...");
    try {
      // Push Buyers
      const contractLines = RAW_CONTRACT_CSV.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("Contract No"));
      const buyersToPush = contractLines.map(line => {
        const parts = line.split(",");
        const file_no = parts[0]?.trim();
        const name = parts.slice(1).join(",")?.trim();
        return { file_no, name };
      }).filter(b => b.name);
      
      console.log(`Pushing ${buyersToPush.length} buyers...`);
      if (buyersToPush.length > 0) {
        const { error: err } = await sb.from("buyers").upsert(buyersToPush, { onConflict: 'file_no' });
        if (err) {
          console.error("Buyers push error:", err);
          throw new Error(`Buyers push failed: ${err.message}. Ensure 'file_no' has a UNIQUE constraint in Supabase.`);
        }
      }

      // Push Fabrics
      const fabricLines = RAW_FABRIC_CSV.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("Fabric Code"));
      const fabricsToPush = fabricLines.map(line => {
        const parts = line.split(",");
        const code = parts[0]?.trim();
        const description = parts.slice(1).join(",")?.trim();
        return { code, description };
      }).filter(f => f.code);
      
      console.log(`Pushing ${fabricsToPush.length} fabrics...`);
      // Batch fabrics if too many
      if (fabricsToPush.length > 0) {
        const chunkSize = 500;
        for (let i = 0; i < fabricsToPush.length; i += chunkSize) {
          const chunk = fabricsToPush.slice(i, i + chunkSize);
          const { error: err } = await sb.from("fabrics").upsert(chunk, { onConflict: 'code' });
          if (err) {
            console.error("Fabrics push error:", err);
            throw new Error(`Fabrics push failed at chunk ${i/chunkSize + 1}: ${err.message}. Ensure 'code' has a UNIQUE constraint.`);
          }
        }
      }

      // Push Suppliers
      const supplierLines = RAW_SUPPLIER_CSV.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("Supplier Code"));
      const suppliersToPush = supplierLines.map(line => {
        const parts = line.split(",");
        const code = parts[0]?.trim();
        const name = parts.slice(1).join(",")?.trim();
        return { code, name };
      }).filter(s => s.code);
      
      console.log(`Pushing ${suppliersToPush.length} suppliers...`);
      if (suppliersToPush.length > 0) {
        const { error: err } = await sb.from("suppliers").upsert(suppliersToPush, { onConflict: 'code' });
        if (err) {
          console.error("Suppliers push error:", err);
          throw new Error(`Suppliers push failed: ${err.message}. Ensure 'code' has a UNIQUE constraint.`);
        }
      }

      console.log("Data push completed successfully!");
      alert("Data pushed successfully!");
      checkSyncStatus();
      fetchData();
      onDataChange();
    } catch (error: any) {
      console.error("Push error:", error);
      alert(`Error pushing data: ${error.message || "Unknown error"}`);
    } finally {
      setIsPushing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sb = getSupabase();
    if (!sb) return alert("Supabase is not configured.");

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").map(l => l.trim()).filter(l => l);
        
        if (lines.length < 2) throw new Error("CSV file is empty or has no data.");

        // Try to detect header and data
        const header = lines[0].toLowerCase();
        const dataLines = lines.slice(1);

        if (activeTab === "fabrics") {
          const toPush = dataLines.map(line => {
            const parts = line.split(",");
            return { code: parts[0]?.trim(), description: parts.slice(1).join(",")?.trim() };
          }).filter(f => f.code);

          const chunkSize = 500;
          for (let i = 0; i < toPush.length; i += chunkSize) {
            const { error } = await sb.from("fabrics").upsert(toPush.slice(i, i + chunkSize), { onConflict: 'code' });
            if (error) throw error;
          }
        } else if (activeTab === "buyers") {
          const toPush = dataLines.map(line => {
            const parts = line.split(",");
            return { file_no: parts[0]?.trim(), name: parts.slice(1).join(",")?.trim() };
          }).filter(b => b.name);
          const { error } = await sb.from("buyers").upsert(toPush, { onConflict: 'file_no' });
          if (error) throw error;
        } else if (activeTab === "suppliers") {
          const toPush = dataLines.map(line => {
            const parts = line.split(",");
            return { code: parts[0]?.trim(), name: parts.slice(1).join(",")?.trim() };
          }).filter(s => s.code);
          const { error } = await sb.from("suppliers").upsert(toPush, { onConflict: 'code' });
          if (error) throw error;
        }

        alert(`Successfully imported data for ${activeTab}!`);
        fetchData();
        onDataChange();
        checkSyncStatus();
      } catch (err: any) {
        console.error("Upload error:", err);
        alert(`Failed to import CSV: ${err.message}`);
      } finally {
        setIsUploading(false);
        if (e.target) e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const filteredData = () => {
    const query = searchQuery.toLowerCase();
    if (activeTab === "buyers") return buyers.filter(b => b.name.toLowerCase().includes(query) || b.file_no.toLowerCase().includes(query));
    if (activeTab === "fabrics") return fabrics.filter(f => f.code.toLowerCase().includes(query) || f.description.toLowerCase().includes(query));
    if (activeTab === "colors") return colors.filter(c => c.name.toLowerCase().includes(query));
    if (activeTab === "suppliers") return suppliers.filter(s => s.code.toLowerCase().includes(query) || s.name.toLowerCase().includes(query));
    if (activeTab === "dashboard") return reports.filter(r => 
      r.buyer_name?.toLowerCase().includes(query) || 
      r.invoice_no?.toLowerCase().includes(query) ||
      r.file_no?.toLowerCase().includes(query)
    );
    return [];
  };

  const downloadReport = async (report: any, type: 'pdf' | 'excel') => {
    const header = {
      buyerName: report.buyer_name,
      supplierName: report.supplier_name,
      fileNo: report.file_no,
      invoiceNo: report.invoice_no,
      lcNumber: report.lc_number,
      invoiceDate: report.invoice_date,
      billingDate: report.billing_date,
    };
    const items = report.items;
    const totals = calculateTotals(items);
    const filenameDate = getFilenameDate(header.billingDate);
    const filename = `Bill of Buyer ${header.buyerName} $${totals.totalValue.toFixed(2)} DATE-${filenameDate}`;

    if (type === 'pdf') {
      await generatePDF(header, items, totals, filename);
    } else {
      await generateExcel(header, items, totals, filename);
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    if (activeTab === "buyers") setNewBuyer({ name: item.name, file_no: item.file_no });
    else if (activeTab === "fabrics") setNewFabric({ code: item.code, description: item.description });
    else if (activeTab === "colors") setNewColor(item.name);
    else if (activeTab === "suppliers") setNewSupplier({ code: item.code, name: item.name });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings size={20} />
            Management Settings
          </h2>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <div className="flex flex-col items-end gap-1">
                {!getSupabase() && (
                  <span className="text-[10px] text-red-500 font-bold animate-pulse">
                    Supabase Not Configured!
                  </span>
                )}
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50">
                    <FileUp size={14} />
                    {isUploading ? "Uploading..." : "Upload CSV"}
                    <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                  </label>
                  <button 
                    onClick={pushInitialData} 
                    disabled={isPushing || !getSupabase()}
                    className="flex items-center gap-2 text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    <CloudUpload size={14} />
                    {isPushing ? "Pushing..." : "Push CSV Data"}
                  </button>
                </div>
                <div className="flex gap-2 text-[10px] font-medium">
                  <span className={syncStatus.buyers ? "text-emerald-600" : "text-amber-600"}>
                    Buyers: {syncStatus.buyers ? "✓" : "✗"}
                  </span>
                  <span className={syncStatus.fabrics ? "text-emerald-600" : "text-amber-600"}>
                    Fabrics: {syncStatus.fabrics ? "✓" : "✗"}
                  </span>
                  <span className={syncStatus.suppliers ? "text-emerald-600" : "text-amber-600"}>
                    Suppliers: {syncStatus.suppliers ? "✓" : "✗"}
                  </span>
                </div>
              </div>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="p-8 flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Lock size={32} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Admin Access Required</h3>
              <p className="text-slate-500 text-sm">Please enter the administrator password to continue.</p>
            </div>
            <form onSubmit={handleLogin} className="w-full max-w-xs flex flex-col gap-3">
              <input
                type="password"
                placeholder="Enter Password"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Login
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto shrink-0">
              {(["dashboard", "buyers", "fabrics", "colors", "suppliers"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`flex-1 min-w-[120px] p-4 text-sm font-bold capitalize transition-all flex items-center justify-center gap-2 border-r border-slate-200 last:border-r-0 ${
                    activeTab === tab 
                      ? "bg-white border-t-4 border-t-blue-600 text-blue-600 shadow-sm" 
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  }`}
                  onClick={() => {
                    setActiveTab(tab);
                    setEditingId(null);
                    setSearchQuery("");
                  }}
                >
                  {tab === "dashboard" && <LayoutDashboard size={18} />}
                  <span>{tab}</span>
                </button>
              ))}
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              {activeTab !== "dashboard" && (
                <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-bold mb-3 uppercase tracking-wider text-slate-500">
                    {editingId ? "Edit" : "Add New"} {activeTab.slice(0, -1)}
                  </h4>
                  <div className="flex gap-2">
                    {activeTab === "buyers" && (
                      <>
                        <input
                          type="text"
                          placeholder="Buyer Name"
                          className="flex-1 p-2 border rounded text-sm"
                          value={newBuyer.name}
                          onChange={(e) => setNewBuyer({ ...newBuyer, name: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="File No (Optional)"
                          className="w-32 p-2 border rounded text-sm"
                          value={newBuyer.file_no}
                          onChange={(e) => setNewBuyer({ ...newBuyer, file_no: e.target.value })}
                        />
                      </>
                    )}
                    {activeTab === "fabrics" && (
                      <>
                        <input
                          type="text"
                          placeholder="Fabric Code"
                          className="w-32 p-2 border rounded text-sm"
                          value={newFabric.code}
                          onChange={(e) => setNewFabric({ ...newFabric, code: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          className="flex-1 p-2 border rounded text-sm"
                          value={newFabric.description}
                          onChange={(e) => setNewFabric({ ...newFabric, description: e.target.value })}
                        />
                      </>
                    )}
                    {activeTab === "colors" && (
                      <input
                        type="text"
                        placeholder="Color Name"
                        className="flex-1 p-2 border rounded text-sm"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                      />
                    )}
                    {activeTab === "suppliers" && (
                      <>
                        <input
                          type="text"
                          placeholder="Supplier Code"
                          className="w-32 p-2 border rounded text-sm"
                          value={newSupplier.code}
                          onChange={(e) => setNewSupplier({ ...newSupplier, code: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Supplier Name"
                          className="flex-1 p-2 border rounded text-sm"
                          value={newSupplier.name}
                          onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                        />
                      </>
                    )}
                    <button onClick={addItem} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm font-bold px-4">
                      <Save size={16} />
                      {editingId ? "Update" : "Add"}
                    </button>
                    {editingId && (
                      <button onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-700 p-2 rounded hover:bg-slate-300 transition-colors text-sm font-bold px-4">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold mb-3 uppercase tracking-wider text-slate-500">
                  {activeTab === "dashboard" ? "Generated Bills History" : `Existing ${activeTab}`}
                </h4>
                
                {activeTab === "dashboard" ? (
                  filteredData().map((report: any) => (
                    <div key={report.id} className="flex flex-col p-4 bg-white border rounded-lg hover:border-blue-200 transition-colors gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-blue-600">{report.buyer_name}</div>
                          <div className="text-xs text-slate-500 flex gap-3 mt-1">
                            <span>Inv: {report.invoice_no}</span>
                            <span>File: {report.file_no}</span>
                            <span>Date: {report.billing_date}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-700">${report.total_amount?.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">{new Date(report.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => downloadReport(report, 'pdf')}
                            className="flex items-center gap-1 text-[10px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                          >
                            <PdfIcon size={12} /> PDF
                          </button>
                          <button 
                            onClick={() => downloadReport(report, 'excel')}
                            className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded hover:bg-emerald-100 transition-colors"
                          >
                            <FileSpreadsheet size={12} /> Excel
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => onLoadReport(report)}
                            className="flex items-center gap-1 text-[10px] font-bold bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                          >
                            <Edit2 size={12} /> Edit & Re-download
                          </button>
                          <button 
                            onClick={() => deleteItem(report.id)}
                            className="text-slate-300 hover:text-red-600 transition-colors p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  filteredData().map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-white border rounded-lg hover:border-blue-200 transition-colors group">
                      <div>
                        <div className="font-bold text-sm">
                          {activeTab === "buyers" ? item.name : activeTab === "fabrics" ? item.code : activeTab === "suppliers" ? item.code : item.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {activeTab === "buyers" ? (item.file_no ? `File: ${item.file_no}` : "") : 
                           activeTab === "fabrics" ? item.description : 
                           activeTab === "suppliers" ? item.name : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(item)} className="text-slate-300 hover:text-blue-600 transition-colors p-2">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="text-slate-300 hover:text-red-600 transition-colors p-2">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
                {filteredData().length === 0 && (
                  <div className="text-center p-8 text-slate-400 text-sm italic">
                    {searchQuery ? "No matching results found." : `No items found. Add your first ${activeTab.slice(0, -1)} above.`}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
