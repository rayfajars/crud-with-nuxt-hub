<script setup lang="ts">
type User = {
  id: number
  name: string
  email: string
  phone: string | null
  avatar: string
  createdAt: string
}

const { data: users, refresh, error: listError, pending } = await useFetch<User[]>('/api/users')

const form = reactive({
  name: '',
  email: '',
  phone: '',
  avatar: '',
})

const editingId = ref<number | null>(null)
const editForm = reactive({
  name: '',
  email: '',
  phone: '',
  avatar: '',
})

const formError = ref('')
const editError = ref('')
const actionPending = ref(false)

async function createUser() {
  formError.value = ''
  actionPending.value = true
  try {
    await $fetch('/api/users', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        avatar: form.avatar || undefined,
      },
    })
    form.name = ''
    form.email = ''
    form.phone = ''
    form.avatar = ''
    await refresh()
  }
  catch (err: unknown) {
    formError.value = extractError(err)
  }
  finally {
    actionPending.value = false
  }
}

function startEdit(user: User) {
  editingId.value = user.id
  editForm.name = user.name
  editForm.email = user.email
  editForm.phone = user.phone || ''
  editForm.avatar = user.avatar
  editError.value = ''
}

function cancelEdit() {
  editingId.value = null
  editError.value = ''
}

async function saveEdit() {
  if (editingId.value == null) return
  editError.value = ''
  actionPending.value = true
  try {
    await $fetch(`/api/users/${editingId.value}`, {
      method: 'PUT',
      body: {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        avatar: editForm.avatar,
      },
    })
    editingId.value = null
    await refresh()
  }
  catch (err: unknown) {
    editError.value = extractError(err)
  }
  finally {
    actionPending.value = false
  }
}

async function removeUser(id: number) {
  if (!confirm(`Delete user #${id}?`)) return
  formError.value = ''
  actionPending.value = true
  try {
    await $fetch(`/api/users/${id}`, { method: 'DELETE' })
    if (editingId.value === id) cancelEdit()
    await refresh()
  }
  catch (err: unknown) {
    formError.value = extractError(err)
  }
  finally {
    actionPending.value = false
  }
}

function extractError(err: unknown): string {
  const e = err as { data?: { statusMessage?: string; message?: string }; statusMessage?: string; message?: string }
  return e?.data?.statusMessage || e?.data?.message || e?.statusMessage || e?.message || 'Request failed'
}
</script>

<template>
  <main class="wrap">

    <section class="card">
      <h2>Create user</h2>
      <form class="form" @submit.prevent="createUser">
        <label>Name <input v-model="form.name"  /></label>
        <label>Email <input v-model="form.email" type="email"  /></label>
        <label>Phone <input v-model="form.phone" type="tel" placeholder="optional" /></label>
        <label>Avatar URL <input v-model="form.avatar" placeholder="optional" /></label>
        <button type="submit" :disabled="actionPending">Create</button>
      </form>
      <p v-if="formError" class="error">{{ formError }}</p>
    </section>

    <section class="card">
      <h2>Users</h2>
      <p v-if="pending">Loading…</p>
      <p v-else-if="listError" class="error">{{ listError.message || 'Failed to load users' }}</p>
      <p v-else-if="!users?.length">No users yet.</p>
      <ul v-else class="list">
        <li v-for="user in users" :key="user.id" class="item">
          <div v-if="editingId !== user.id" class="row">
            <img :src="user.avatar" alt="" class="avatar" width="40" height="40" />
            <div class="meta">
              <strong>#{{ user.id }} {{ user.name }}</strong>
              <span>{{ user.email }}</span>
              <span v-if="user.phone">{{ user.phone }}</span>
              <small>{{ user.createdAt }}</small>
            </div>
            <div class="actions">
              <button type="button" @click="startEdit(user)">Edit</button>
              <button type="button" class="danger" :disabled="actionPending" @click="removeUser(user.id)">Delete</button>
            </div>
          </div>
          <form v-else class="form edit" @submit.prevent="saveEdit">
            <label>Name <input v-model="editForm.name"  /></label>
            <label>Email <input v-model="editForm.email" type="email"  /></label>
            <label>Phone <input v-model="editForm.phone" type="tel" placeholder="optional" /></label>
            <label>Avatar URL <input v-model="editForm.avatar"  /></label>
            <div class="actions">
              <button type="submit" :disabled="actionPending">Save</button>
              <button type="button" @click="cancelEdit">Cancel</button>
            </div>
            <p v-if="editError" class="error">{{ editError }}</p>
          </form>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.wrap { max-width: 720px; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; }
.card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; }
.form { display: grid; gap: 0.5rem; }
.form label { display: grid; gap: 0.25rem; font-size: 0.9rem; }
input { padding: 0.4rem 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
button { padding: 0.4rem 0.75rem; cursor: pointer; }
.danger { color: #b00020; }
.error { color: #b00020; margin: 0.5rem 0 0; }
.list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.75rem; }
.item { border-top: 1px solid #eee; padding-top: 0.75rem; }
.item:first-child { border-top: 0; padding-top: 0; }
.row { display: flex; gap: 0.75rem; align-items: center; }
.avatar { border-radius: 50%; object-fit: cover; background: #f0f0f0; }
.meta { display: grid; flex: 1; gap: 0.15rem; }
.meta small { color: #666; }
.actions { display: flex; gap: 0.4rem; }
.edit { margin-top: 0.25rem; }
</style>
