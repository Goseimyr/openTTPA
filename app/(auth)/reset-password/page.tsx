import Link from "next/link";
import { redirect } from "next/navigation";
import { updatePassword } from "../login/actions";
import { createClient } from "@/utils/supabase/server";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/forgot-password?message=Använd återställningslänken i e-postmeddelandet.");
  }

  return (
    <main className="shell">
      <section className="grid two" style={{ alignItems: "start", paddingTop: 48 }}>
        <div className="stack">
          <h1>Välj nytt lösenord</h1>
          <p className="lead">
            Ange ett nytt lösenord för ditt konto. När lösenordet har sparats är du inloggad och kan
            fortsätta till dina organisationer.
          </p>
        </div>

        <div className="panel grid">
          <form className="grid" action={updatePassword}>
            <h2>Nytt lösenord</h2>
            {params.message ? <p className="form-message">{params.message}</p> : null}
            <label>
              Nytt lösenord
              <input name="password" type="password" autoComplete="new-password" minLength={8} required />
            </label>
            <label>
              Upprepa nytt lösenord
              <input name="confirm_password" type="password" autoComplete="new-password" minLength={8} required />
            </label>
            <button type="submit">Spara nytt lösenord</button>
          </form>
          <p className="muted">
            Vill du avbryta? <Link href="/login">Gå till inloggning</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
