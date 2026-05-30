import { redirect } from "next/navigation";
import { createClient, hasSupabaseEnv } from "@/utils/supabase/server";

export default async function ProfilePage() {
  if (!hasSupabaseEnv()) {
    return (
      <main className="shell">
        <section className="panel">
          <h1>Profil</h1>
          <p className="muted">
            Lägg in Supabase-variablerna i <code>.env.local</code> för att använda profiler.
          </p>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const createdAt = new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "long",
    timeStyle: "short"
  }).format(new Date(user.created_at));

  const lastSignInAt = user.last_sign_in_at
    ? new Intl.DateTimeFormat("sv-SE", {
        dateStyle: "long",
        timeStyle: "short"
      }).format(new Date(user.last_sign_in_at))
    : "Ej registrerat";

  return (
    <main className="shell" style={{ paddingBottom: 64 }}>
      <section className="grid two" style={{ alignItems: "start", paddingTop: 40 }}>
        <div>
          <h1>Profil</h1>
          <p className="lead">Här ser du kontot som är inloggat i OpenTTPA.</p>
        </div>

        <section className="panel">
          <dl>
            <div className="definition">
              <dt>E-post</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="definition">
              <dt>Användar-id</dt>
              <dd>{user.id}</dd>
            </div>
            <div className="definition">
              <dt>Konto skapat</dt>
              <dd>{createdAt}</dd>
            </div>
            <div className="definition">
              <dt>Senaste inloggning</dt>
              <dd>{lastSignInAt}</dd>
            </div>
          </dl>
        </section>
      </section>
    </main>
  );
}
