// Environment variable validation for production readiness

interface RequiredEnvVars {
  DATABASE_URL: string;
  SESSION_SECRET: string;
}

interface OptionalEnvVars {
  SENDGRID_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  VITE_STRIPE_PUBLIC_KEY?: string;
}

export function validateEnvironment(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required for database connection');
  }

  if (!process.env.SESSION_SECRET) {
    errors.push('SESSION_SECRET is required for secure session management');
  }

  // Check optional but recommended variables
  if (!process.env.MAILERSEND_API_KEY) {
    warnings.push('MAILERSEND_API_KEY not set - email functionality will be disabled');
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    warnings.push('STRIPE_SECRET_KEY not set - payment processing will be disabled');
  }

  // Check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    if (process.env.SESSION_SECRET === 'dev-secret-key') {
      errors.push('SESSION_SECRET cannot be the default "dev-secret-key" in production');
    }

    // Ensure minimum entropy for session secret
    if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
      errors.push('SESSION_SECRET must be at least 32 characters in production for adequate security');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function printEnvironmentStatus() {
  const validation = validateEnvironment();

  console.log('\n' + '='.repeat(60));
  console.log('🔍 ENVIRONMENT VALIDATION');
  console.log('='.repeat(60));

  if (validation.isValid) {
    console.log('✅ All required environment variables are set\n');
  } else {
    console.log('❌ MISSING REQUIRED ENVIRONMENT VARIABLES:\n');
    validation.errors.forEach(error => {
      console.log(`   ❌ ${error}`);
    });
    console.log('');
  }

  if (validation.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    validation.warnings.forEach(warning => {
      console.log(`   ⚠️  ${warning}`);
    });
    console.log('');
  }

  console.log('📋 Configuration Status:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   DATABASE: ${process.env.DATABASE_URL ? '✅ Connected' : '❌ Not configured'}`);
  console.log(`   SESSION_SECRET: ${process.env.SESSION_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SENDGRID: ${process.env.SENDGRID_API_KEY ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`   STRIPE: ${process.env.STRIPE_SECRET_KEY ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log('='.repeat(60) + '\n');

  return validation;
}
