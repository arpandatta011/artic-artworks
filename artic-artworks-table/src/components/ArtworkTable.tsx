import { useEffect, useState, useRef, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import type { DataTablePageEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { OverlayPanel } from "primereact/overlaypanel";

import type { Artwork } from "../types/artwork";
import { fetchArtworks } from "../api/artworksApi";

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

const ROWS_PER_PAGE = 12;

const ArtworkTable = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);

  // ================= GLOBAL RANGE SELECTION =================
  const [selectFromStartCount, setSelectFromStartCount] = useState(0);
  const [additionalSelected, setAdditionalSelected] = useState<Set<number>>(
    new Set(),
  );
  const [deselected, setDeselected] = useState<Set<number>>(new Set());

  const overlayRef = useRef<OverlayPanel>(null);
  const [inputCount, setInputCount] = useState("");

  // ================= FETCH DATA =================
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchArtworks(page, ROWS_PER_PAGE);
        setArtworks(data.data);
        setTotalRecords(data.pagination.total);
      } catch (error) {
        console.error("Error fetching artworks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [page]);

  const onPageChange = (e: DataTablePageEvent) => {
    setPage((e.page ?? 0) + 1);
  };

  // ================= SELECTION LOGIC =================
  const isRowSelected = useCallback(
    (art: Artwork, index: number): boolean => {
      const globalIndex = (page - 1) * ROWS_PER_PAGE + index;
      if (additionalSelected.has(art.id)) return true;
      if (deselected.has(art.id)) return false;
      if (globalIndex < selectFromStartCount) return true;
      return false;
    },
    [page, selectFromStartCount, additionalSelected, deselected],
  );

  const selectedRowsForCurrentPage = artworks.filter((art, index) =>
    isRowSelected(art, index),
  );

  const handleSelectionChange = (e: any) => {
    const newSelectedIds = new Set((e.value as Artwork[]).map((a) => a.id));

    artworks.forEach((art, index) => {
      const globalIndex = (page - 1) * ROWS_PER_PAGE + index;
      const inRange = globalIndex < selectFromStartCount;
      const isNowSelected = newSelectedIds.has(art.id);

      if (isNowSelected) {
        if (inRange) {
          setDeselected((prev) => {
            const next = new Set(prev);
            next.delete(art.id);
            return next;
          });
        } else {
          setAdditionalSelected((prev) => new Set(prev).add(art.id));
        }
      } else {
        if (inRange) {
          setDeselected((prev) => new Set(prev).add(art.id));
        } else {
          setAdditionalSelected((prev) => {
            const next = new Set(prev);
            next.delete(art.id);
            return next;
          });
        }
      }
    });
  };

  // ================= CUSTOM SELECT (GLOBAL) =================
  const handleCustomSelect = () => {
    const n = Number(inputCount);
    if (isNaN(n) || n <= 0) return;

    setSelectFromStartCount(n);
    setAdditionalSelected(new Set());
    setDeselected(new Set());

    overlayRef.current?.hide();
    setInputCount("");
  };

  const selectedCount =
    selectFromStartCount - deselected.size + additionalSelected.size;

  // ================= ARROW HEADER =================
  const arrowHeader = (
    <ArrowDropDownIcon
      style={{ cursor: "pointer", fontSize: 20 }}
      onClick={(e) => {
        e.stopPropagation();
        overlayRef.current?.toggle(e);
      }}
    />
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontWeight: 600 }}>Selected Rows: {selectedCount}</span>
      </div>

      <OverlayPanel ref={overlayRef} className="artwork-overlay-down">
        <div style={{ padding: 16, minWidth: 250 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
            Select first N rows:
          </label>
          <input
            type="number"
            min={1}
            value={inputCount}
            onChange={(e) => setInputCount(e.target.value)}
            placeholder="Enter number"
            style={{
              width: "100%",
              padding: 8,
              marginBottom: 12,
              borderRadius: 6,
              border: "1px solid #ddd",
            }}
            onKeyDown={(e) => e.key === "Enter" && handleCustomSelect()}
          />
          <button
            onClick={handleCustomSelect}
            style={{
              width: "100%",
              padding: 8,
              backgroundColor: "#3B82F6",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            submit
          </button>
        </div>
      </OverlayPanel>

      <DataTable
        value={artworks}
        lazy
        paginator
        rows={ROWS_PER_PAGE}
        totalRecords={totalRecords}
        first={(page - 1) * ROWS_PER_PAGE}
        onPage={onPageChange}
        loading={loading}
        selection={selectedRowsForCurrentPage}
        onSelectionChange={handleSelectionChange}
        dataKey="id"
        selectionMode="multiple"
        paginatorTemplate="CurrentPageReport PrevPageLink PageLinks NextPageLink"
        currentPageReportTemplate="{first} to {last} of {totalRecords} entries"
        paginatorClassName="custom-paginator"
      >
        <Column
          selectionMode="multiple"
          header={arrowHeader}
          headerStyle={{ width: "5rem" }}
        />
        <Column field="title" header="Title" style={{ minWidth: "14rem" }} />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column
          field="artist_display"
          header="Artist"
          style={{ minWidth: "14rem" }}
        />
        <Column
          field="inscriptions"
          header="Inscriptions"
          style={{ minWidth: "14rem" }}
          body={(rowData: Artwork) =>
            rowData.inscriptions
              ? rowData.inscriptions.length > 100
                ? rowData.inscriptions.slice(0, 100) + "…"
                : rowData.inscriptions
              : "—"
          }
        />
        <Column field="date_start" header="Date Start" />
        <Column field="date_end" header="Date End" />
      </DataTable>
    </div>
  );
};

export default ArtworkTable;
