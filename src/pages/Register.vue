<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { useRegister } from '@/composables/useRegister'

import RegisterPhoneStep from '@/components/register/RegisterPhoneStep.vue'
import RegisterOtpStep from '@/components/register/RegisterOtpStep.vue'
import RegisterInfoStep from '@/components/register/RegisterInfoStep.vue'

const {
  step,
  phone,
  loading,
  otpStepRef,
  handlePhoneSubmit,
  handleVerify,
  handleResend,
  handleFinalSubmit
} = useRegister()
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-cover bg-center py-12 px-4" style="background-image: url('/bg4.png');">
    <div class="w-full max-w-md">
      <Card class="overflow-hidden p-0 shadow-2xl rounded-xl bg-white">
        <CardContent class="p-8">
          <div class="mb-4 text-left">
            <h2 class="text-xl font-semibold text-black">Регистрация</h2>
            <p class="text-sm text-gray-600">Создайте новый аккаунт Kezekshi</p>
          </div>

          <RegisterPhoneStep 
            v-if="step === 1" 
            :loading="loading" 
            @submit="handlePhoneSubmit" 
          />

          <RegisterOtpStep 
            v-if="step === 2" 
            ref="otpStepRef"
            :loading="loading" 
            :phone="phone"
            @verify="handleVerify"
            @resend="handleResend"
            @back="step = 1"
          />

          <RegisterInfoStep 
            v-if="step === 3" 
            :loading="loading" 
            @submit="handleFinalSubmit"
            @back="step = 2"
          />

        </CardContent>
      </Card>
    </div>
  </div>
</template>