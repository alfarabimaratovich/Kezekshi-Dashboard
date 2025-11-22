<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useLogin } from '@/composables/useLogin'

const {
  phone,
  password,
  loading,
  errorInputClass,
  handleLogin
} = useLogin()
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-cover bg-center py-12 px-4" style="background-image: url('/bg4.png');">
    <div class="w-full max-w-md">
      <Card class="overflow-hidden p-0 shadow-2xl rounded-xl bg-white">
        <CardContent class="p-0">
          <div class="p-8 md:p-10 bg-white text-black flex flex-col justify-center">
            <img src="/Kezekshi_logo.svg" alt="Kezekshi" class="h-16 w-auto mx-auto mb-6" />
            <form @submit="handleLogin" class="space-y-6">
              <FieldGroup>
                <div class="flex flex-col items-center gap-2 text-center">
                  <h1 class="text-2xl font-bold text-black">С возвращением</h1>
                  <p class="text-gray-600 text-sm">Войдите в свой аккаунт Kezekshi</p>
                </div>
                <Field>
                  <FieldLabel for="phone" class="text-black">Номер телефона</FieldLabel>
                  <Input id="phone" type="tel" placeholder="+7" v-model="phone" required :class="errorInputClass" />
                </Field>
                <Field>
                  <div class="flex items-center">
                    <FieldLabel for="password" class="text-black">Пароль</FieldLabel>
                    <a href="/reset" class="ml-auto text-sm underline-offset-2 hover:underline text-gray-600">Восстановить пароль</a>
                  </div>
                  <Input id="password" type="password" v-model="password" required :class="errorInputClass" />
                </Field>
                
                <Field>
                  <Button type="submit" :disabled="loading" :loading="loading" class="w-full bg-blue-600 text-white hover:bg-blue-700">
                    <span v-if="loading">Вход...</span>
                    <span v-else>Войти</span>
                  </Button>
                </Field>
                <div class="text-center mt-2">
                  <a href="/register" class="text-sm underline text-gray-600">Перейти к регистрации</a>
                </div>
                <FieldDescription class="text-center text-xs text-gray-600 mt-4">Нажимая «Войти», вы соглашаетесь с нашими <a class="underline" href="#">Условиями обслуживания</a> и <a class="underline" href="#">Политикой конфиденциальности</a>.</FieldDescription>
              </FieldGroup>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
