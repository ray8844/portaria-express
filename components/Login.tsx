const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    // 🔑 Força validação da sessão
    if (!data.session) {
      throw new Error("Sessão não criada. Tente novamente.");
    }

    // Aqui não precisa redirecionar
    // O AuthContext vai detectar

  } catch (err: any) {
    setError(err.message || "Falha ao realizar login");
  } finally {
    setLoading(false);
  }
};
