"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Permit } from "@/lib/schemas/permit.schema";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/auth.store";
import { permitApi } from "@/lib/axios/permit";
import Modal, { ModalHandle } from "@/app/components/modal";
import PermitForm from "@/app/forms/permit.form";

export default function PermitDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const [permit, setPermit] = useState<Permit | null>(null);
  const modalRef = useRef<ModalHandle>(null);

  useEffect(() => {
    permitApi
      .getById(Number(id))
      .then(setPermit)
      .catch(() => router.push("/dashboard"));
  }, [id, router]);

  if (!permit) return null;

  const stateLabel = () => {
    if (permit.state === null)
      return <span className="badge badge-warning">In attesa</span>;
    if (permit.state === true)
      return <span className="badge badge-success">Approvato</span>;
    return <span className="badge badge-error">Rifiutato</span>;
  };

  const handleEvaluate = async (state: boolean) => {
    try {
      const updated = await permitApi.evaluate(Number(id), state);
      setPermit(updated);
      toast.success(state ? "Permit approvato" : "Permit rifiutato");
    } catch {}
  };

  const handleDelete = async () => {
    try {
      await permitApi.remove(Number(id));
      toast.success("Permit eliminato");
      router.push("/dashboard");
    } catch {}
  };

  return (
    <div className="p-6 flex justify-center">
      <div className="w-[900px] h-[520px]">

        <div className="card card-side bg-base-100 shadow-sm h-full overflow-hidden">

          {/* IMAGE */}
          <figure className="w-48 h-full shrink-0">
            <img
              src="https://img.daisyui.com/images/stock/photo-1635805737707-575885ab0820.webp"
              alt="Permit"
              className="h-full w-full object-cover"
            />
          </figure>

          {/* BODY */}
          <div className="card-body flex flex-col h-full overflow-hidden">

            {/* HEADER */}
            <div className="flex items-center justify-between shrink-0">
              <h2 className="card-title">Permit #{permit.id}</h2>
              {stateLabel()}
            </div>

            {/* 👇 SOLO RESPONSABILE: richiedente */}
            {user?.roleName === "RESPONSABILE" && permit.user && (
              <div className="mt-2 text-sm">
                <span className="text-base-content/50">Richiedente: </span>
                <span className="font-medium">
                  {permit.user.firstName} {permit.user.lastName}
                </span>
              </div>
            )}

            {/* DELETE */}
            {user?.roleName === "RESPONSABILE" && permit.state === true && (
              <div className="flex justify-end shrink-0 mt-2">
                <button
                  className="btn btn-error btn-sm"
                  onClick={handleDelete}
                >
                  Elimina
                </button>
              </div>
            )}

            {/* SCROLL AREA */}
            <div className="flex-1 overflow-y-auto pr-2 mt-3 space-y-4">

              <div className="flex gap-6">
                <div>
                  <p className="text-sm text-base-content/50">Data inizio</p>
                  <p className="font-medium">
                    {new Date(permit.startDate).toLocaleDateString("it-IT")}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-base-content/50">Data fine</p>
                  <p className="font-medium">
                    {new Date(permit.endDate).toLocaleDateString("it-IT")}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-base-content/50">Categoria</p>
                <p className="font-medium">{permit.categoryId}</p>
              </div>

              {permit.evaluationDate && (
                <div>
                  <p className="text-sm text-base-content/50">
                    Data valutazione
                  </p>
                  <p className="font-medium">
                    {new Date(permit.evaluationDate).toLocaleDateString("it-IT")}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-base-content/50">Motivazione</p>
                <p className="font-medium break-words">
                  {permit.motivation}
                </p>
              </div>

            </div>

            {/* ACTIONS */}
            <div className="card-actions justify-end mt-4 shrink-0">

              {user?.roleName === "RESPONSABILE" && permit.state === null && (
                <>
                  <button
                    className="btn btn-error"
                    onClick={() => handleEvaluate(false)}
                  >
                    Rifiuta
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => handleEvaluate(true)}
                  >
                    Approva
                  </button>
                </>
              )}

              {user?.roleName === "DIPENDENTE" && permit.state === null && (
                <button
                  className="btn btn-primary"
                  onClick={() => modalRef.current?.open()}
                >
                  Modifica
                </button>
              )}

            </div>

          </div>
        </div>
      </div>

      {/* MODAL */}
      {user?.roleName === "DIPENDENTE" && permit.state === null && (
        <Modal ref={modalRef} title="Modifica permit">
          <PermitForm
            defaultValues={permit}
            onSuccess={(updated) => {
              setPermit(updated);
              modalRef.current?.close();
            }}
          />
        </Modal>
      )}
    </div>
  );
}