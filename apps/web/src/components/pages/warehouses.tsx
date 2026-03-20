import { useEffect, useMemo, useState } from "react";
import { PageWrapper, FadeItem } from "../motion-utils";
import { motion } from "motion/react";
import { ChevronRight, MapPin, Package } from "lucide-react";
import { warehouseService, type Warehouse, type WarehouseLocation } from "@/services/warehouse";
import { getApiErrorMessage } from "@/services/api";
import { toast } from "sonner";

interface LocationTreeNode {
  key: string;
  name: string;
  count: number;
  children?: LocationTreeNode[];
}

function TreeNode({ node, type = "zone" }: { node: LocationTreeNode; type?: "zone" | "aisle" | "shelf" }) {
  const [expanded, setExpanded] = useState(type === "zone");
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const coverage = Math.min(100, Math.max(15, node.count * 10));

  const getColor = () => {
    if (coverage > 80) return "bg-red-500";
    if (coverage > 50) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div>
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className="w-full flex items-center gap-3 py-2 px-3 rounded-[8px] hover:bg-slate-100/60 transition-colors text-left group"
      >
        {hasChildren ? (
          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </motion.div>
        ) : (
          <div className="w-4 h-4" />
        )}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[12px] truncate" style={{ fontWeight: 550 }}>{node.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${coverage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${getColor()}`}
            />
          </div>
          <span className="text-[10px] text-slate-400 w-10 text-right" style={{ fontWeight: 550 }}>
            {node.count}
          </span>
        </div>
      </button>

      {expanded && hasChildren ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-3 border-l border-slate-200 pl-3 space-y-0">
          {(node.children || []).map((child) => (
            <TreeNode key={child.key} node={child} type={type === "zone" ? "aisle" : "shelf"} />
          ))}
        </motion.div>
      ) : null}
    </div>
  );
}

export function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [selectedWh, setSelectedWh] = useState<string>("");
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const loadWarehouses = async () => {
    try {
      setLoadingWarehouses(true);
      const response = await warehouseService.getAll();
      setWarehouses(response);
      if (response.length > 0) {
        setSelectedWh(response[0].id);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Khong tai duoc danh sach kho"));
    } finally {
      setLoadingWarehouses(false);
    }
  };

  const loadLocations = async (warehouseId: string) => {
    if (!warehouseId) {
      setLocations([]);
      return;
    }

    try {
      setLoadingLocations(true);
      const response = await warehouseService.getLocations(warehouseId);
      setLocations(response);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Khong tai duoc locations cua kho"));
      setLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    void loadWarehouses();
  }, []);

  useEffect(() => {
    void loadLocations(selectedWh);
  }, [selectedWh]);

  const selected = useMemo(() => {
    return warehouses.find((warehouse) => warehouse.id === selectedWh) || null;
  }, [selectedWh, warehouses]);

  const zoneTree = useMemo<LocationTreeNode[]>(() => {
    const zoneMap = new Map<string, Map<string, Map<string, number>>>();

    for (const location of locations) {
      const zone = location.zone || "NO-ZONE";
      const aisle = location.aisle || "NO-AISLE";
      const shelf = location.shelf || "NO-SHELF";

      if (!zoneMap.has(zone)) zoneMap.set(zone, new Map());
      const aisleMap = zoneMap.get(zone)!;
      if (!aisleMap.has(aisle)) aisleMap.set(aisle, new Map());
      const shelfMap = aisleMap.get(aisle)!;
      shelfMap.set(shelf, (shelfMap.get(shelf) || 0) + 1);
    }

    return Array.from(zoneMap.entries()).map(([zone, aisleMap]) => {
      const aisleChildren = Array.from(aisleMap.entries()).map(([aisle, shelfMap]) => {
        const shelfChildren = Array.from(shelfMap.entries()).map(([shelf, count]) => ({
          key: `${zone}-${aisle}-${shelf}`,
          name: `${shelf} (${count} bins)`,
          count,
        }));

        const aisleCount = shelfChildren.reduce((sum, child) => sum + child.count, 0);
        return {
          key: `${zone}-${aisle}`,
          name: aisle,
          count: aisleCount,
          children: shelfChildren,
        };
      });

      const zoneCount = aisleChildren.reduce((sum, child) => sum + child.count, 0);
      return {
        key: zone,
        name: zone,
        count: zoneCount,
        children: aisleChildren,
      };
    });
  }, [locations]);

  return (
    <PageWrapper className="space-y-5">
      <FadeItem>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-violet-100 to-purple-50 flex items-center justify-center border border-violet-200/40">
            <Package className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="tracking-[-0.02em]">Warehouses</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">{warehouses.length} warehouses · Real location tree from DB</p>
          </div>
        </div>
      </FadeItem>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-1 space-y-3">
          {loadingWarehouses ? (
            <div className="rounded-[12px] border border-slate-200 bg-white p-4 text-[13px] text-slate-400">Dang tai warehouses...</div>
          ) : warehouses.map((wh) => {
            const locationCount = wh._count?.locations || 0;
            const barPct = Math.min(100, Math.max(8, locationCount * 7));
            return (
              <FadeItem key={wh.id}>
                <motion.button
                  onClick={() => setSelectedWh(wh.id)}
                  whileHover={{ y: -2 }}
                  className={`w-full text-left p-4 rounded-[12px] border-2 transition-all ${selectedWh === wh.id ? "border-violet-500 bg-gradient-to-br from-violet-50/60 to-purple-50/40" : "border-slate-200 bg-white hover:border-slate-300"}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-[12px]" style={{ fontWeight: 650 }}>{wh.code}</h3>
                    {selectedWh === wh.id ? <ChevronRight className="w-4 h-4 text-violet-600" /> : null}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">{wh.name}</p>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${barPct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-violet-500" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    <span style={{ fontWeight: 550 }}>{locationCount}</span> locations · {wh.warehouse_type}
                  </p>
                </motion.button>
              </FadeItem>
            );
          })}
        </div>

        <div className="lg:col-span-3">
          <FadeItem>
            <div className="bg-white rounded-[16px] border border-white/80 p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
              <h3 className="text-[14px] mb-4" style={{ fontWeight: 650 }}>
                {selected?.name || "Warehouse"} - Location Structure
              </h3>
              {loadingLocations ? (
                <div className="text-[13px] text-slate-400">Dang tai location tree...</div>
              ) : zoneTree.length === 0 ? (
                <div className="text-[13px] text-slate-400">Kho chua co locations.</div>
              ) : (
                <div className="space-y-0">
                  {zoneTree.map((zone) => (
                    <TreeNode key={zone.key} node={zone} type="zone" />
                  ))}
                </div>
              )}
            </div>
          </FadeItem>

          <FadeItem>
            <div className="bg-gradient-to-br from-violet-50/80 to-purple-50/50 rounded-[12px] border border-violet-100/60 p-4 mt-4">
              <h4 className="text-[12px]" style={{ fontWeight: 650 }}>Location Overview</h4>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {[
                  { label: "Total Locations", value: locations.length },
                  { label: "Zones", value: new Set(locations.map((item) => item.zone || "NO-ZONE")).size },
                  { label: "Aisles", value: new Set(locations.map((item) => item.aisle || "NO-AISLE")).size },
                  { label: "Active", value: locations.filter((item) => item.is_active).length },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-[10px] text-slate-500 mb-0.5">{s.label}</p>
                    <p className="text-[14px] text-violet-700" style={{ fontWeight: 650 }}>
                      {s.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </FadeItem>
        </div>
      </div>
    </PageWrapper>
  );
}
