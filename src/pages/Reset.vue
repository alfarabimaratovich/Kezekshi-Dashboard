<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { useReset } from '@/composables/useReset'

import ResetPhoneStep from '@/components/reset/ResetPhoneStep.vue'
import ResetPasswordStep from '@/components/reset/ResetPasswordStep.vue'
import ResetSuccessStep from '@/components/reset/ResetSuccessStep.vue'
import RegisterOtpStep from '@/components/register/RegisterOtpStep.vue' // Reusing OTP step

const {
  step,
  phone,
  loading,
  otpStepRef,
  handlePhoneSubmit,
  handleVerify,
  handleResend,
  handlePasswordSubmit
} = useReset()
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-cover bg-center py-12 px-4" style="background-image: url('/bg4.png');">
    <div class="w-full max-w-md">
      <Card class="overflow-hidden p-0 shadow-2xl rounded-xl bg-white">
        <CardContent class="p-8">
          <div class="mb-4 text-left">
            <h2 class="text-xl font-semibold text-black">Восстановление пароля</h2>
          </div>

          <ResetPhoneStep 
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

          <ResetPasswordStep 
            v-if="step === 3" 
            :loading="loading" 
            @submit="handlePasswordSubmit"
            @back="step = 2"
          />

          <ResetSuccessStep v-if="step === 4" />

        </CardContent>
      </Card>
    </div>
  </div>
</template>

