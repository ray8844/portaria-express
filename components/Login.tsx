const handleLogin = async () => {
  setLoading(true)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    alert(error.message)
    setLoading(false)
    return
  }

  // 🔑 ISSO É O MAIS IMPORTANTE
  if (data.session) {
    // não precisa redirecionar manualmente
    // o AuthContext vai detectar a sessão
    setLoading(false)
  }
}
