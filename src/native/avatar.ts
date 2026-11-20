// Own profile photo in the Android app: stored in the Supabase Storage bucket "avatars" as
// <user id>.jpg (each user may write only their own file; see supabase/avatars.sql).
import { configureOwnAvatar } from "@/lib/ll/avatars";
import { SUPABASE_URL, supabase } from "@/integrations/supabase/client";

let uid: string | null = null;

export function setupOwnAvatar() {
  void supabase.auth.getSession().then(({ data }) => (uid = data.session?.user.id ?? null));
  supabase.auth.onAuthStateChange((_e, session) => {
    uid = session?.user.id ?? null;
  });
  configureOwnAvatar({
    upload: async (blob) => {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id;
      if (!id) return false;
      uid = id;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(`${id}.jpg`, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "3600" });
      return !error;
    },
    url: (version) => (uid ? `${SUPABASE_URL}/storage/v1/object/public/avatars/${uid}.jpg?v=${version}` : null),
  });
}
