"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Permit } from "@/lib/schemas/permit.schema";
import { useAuthStore } from "@/lib/store/auth.store";
import { permitApi } from "@/lib/axios/permit";
import Modal, { ModalHandle } from "@/app/components/modal";
import PermitForm from "@/app/forms/permit.form";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [permits, setPermits] = useState<Permit[]>([]);
  const modalRef = useRef<ModalHandle>(null);

  useEffect(() => {
    permitApi
      .getAll()
      .then(setPermits)
      .catch(() => router.push("/login"));
  }, [router]);

  const stateLabel = (state: boolean | null) => {
    if (state === null)
      return <span className="badge badge-warning">In attesa</span>;
    if (state === true)
      return <span className="badge badge-success">Approvato</span>;
    return <span className="badge badge-error">Rifiutato</span>;
  };

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {user?.roleName === "RESPONSABILE"
            ? "Tutti i permit"
            : "I miei permit"}
        </h1>

        {user?.roleName === "DIPENDENTE" && (
          <button
            className="btn btn-primary"
            onClick={() => modalRef.current?.open()}
          >
            Nuovo permit
          </button>
        )}
      </div>

      {/* MODAL CREATE */}
      <Modal ref={modalRef} title="Nuovo permit">
        <PermitForm
          onSuccess={(permit) => {
            setPermits((prev) => [...prev, permit]);
            modalRef.current?.close();
          }}
        />
      </Modal>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="table w-full">

          {/* HEADER */}
          <thead>
            <tr>
              <th>ID</th>

              {user?.roleName === "RESPONSABILE" && (
                <th>Dipendente</th>
              )}

              <th>Categoria</th>
              <th>Dal</th>
              <th>Al</th>
              <th>Motivazione</th>
              <th>Stato</th>
              <th></th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {permits.map((permit) => (
              <tr
                key={permit.id}
                className="hover cursor-pointer"
                onClick={() =>
                  router.push(`/dashboard/permit/${permit.id}`)
                }
              >
                <td>{permit.id}</td>

                {/* 👇 SOLO RESPONSABILE */}
                {user?.roleName === "RESPONSABILE" && (
                  <td className="font-medium">
                    {permit.user?.firstName} {permit.user?.lastName}
                  </td>
                )}

                <td>{permit.categoryId}</td>

                <td>
                  {new Date(permit.startDate).toLocaleDateString("it-IT")}
                </td>

                <td>
                  {new Date(permit.endDate).toLocaleDateString("it-IT")}
                </td>

                <td className="max-w-xs truncate">
                  {permit.motivation}
                </td>

                <td>{stateLabel(permit.state)}</td>

                <td>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/permit/${permit.id}`);
                    }}
                  >
                    {/* dettaglio */}
                  </button>
                </td>
              </tr>
            ))}

            {/* EMPTY STATE */}
            {permits.length === 0 && (
              <tr>
                <td
                  colSpan={
                    user?.roleName === "RESPONSABILE" ? 8 : 7
                  }
                  className="text-center text-base-content/50"
                >
                  Nessun permit trovato
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}