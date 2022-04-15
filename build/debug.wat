(module
 (type $i32_i32_=>_none (func (param i32 i32)))
 (type $none_=>_f64 (func (result f64)))
 (type $none_=>_none (func))
 (type $i32_i32_=>_i32 (func (param i32 i32) (result i32)))
 (type $i64_=>_i64 (func (param i64) (result i64)))
 (type $i32_=>_i32 (func (param i32) (result i32)))
 (type $i64_=>_none (func (param i64)))
 (import "env" "memory" (memory $0 0))
 (import "config" "EXAMPLE_COLOR" (global $src/assembly/config/EXAMPLE_COLOR i32))
 (import "env" "seed" (func $~lib/builtins/seed (result f64)))
 (global $src/assembly/index/NO_COLOR i32 (i32.const 0))
 (global $src/assembly/index/width (mut i32) (i32.const 0))
 (global $src/assembly/index/height (mut i32) (i32.const 0))
 (global $~lib/math/random_seeded (mut i32) (i32.const 0))
 (global $~lib/math/random_state0_64 (mut i64) (i64.const 0))
 (global $~lib/math/random_state1_64 (mut i64) (i64.const 0))
 (global $~lib/math/random_state0_32 (mut i32) (i32.const 0))
 (global $~lib/math/random_state1_32 (mut i32) (i32.const 0))
 (global $~lib/memory/__data_end i32 (i32.const 8))
 (global $~lib/memory/__stack_pointer (mut i32) (i32.const 16392))
 (global $~lib/memory/__heap_base i32 (i32.const 16392))
 (table $0 1 1 funcref)
 (elem $0 (i32.const 1))
 (export "init" (func $src/assembly/index/init))
 (export "drawAtPos" (func $src/assembly/index/drawAtPos))
 (export "fillRandomly" (func $src/assembly/index/fillRandomly))
 (export "step" (func $src/assembly/index/step))
 (export "recalculateMemory" (func $src/assembly/index/recalculateMemory))
 (export "memory" (memory $0))
 (func $src/assembly/index/init (param $0 i32) (param $1 i32)
  local.get $0
  global.set $src/assembly/index/width
  local.get $1
  global.set $src/assembly/index/height
 )
 (func $src/assembly/index/toPointer (param $0 i32) (param $1 i32) (result i32)
  local.get $1
  global.get $src/assembly/index/width
  i32.mul
  local.get $0
  i32.add
  i32.const 4
  i32.mul
 )
 (func $src/assembly/index/drawAtPos (param $0 i32) (param $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  local.get $0
  local.set $3
  local.get $1
  local.set $2
  local.get $3
  local.get $2
  call $src/assembly/index/toPointer
  i32.load
  local.set $3
  local.get $3
  global.get $src/assembly/config/EXAMPLE_COLOR
  i32.eq
  if
   local.get $0
   local.set $5
   local.get $1
   local.set $4
   global.get $src/assembly/index/NO_COLOR
   local.set $2
   local.get $5
   local.get $4
   call $src/assembly/index/toPointer
   local.get $2
   i32.store
  else
   local.get $0
   local.set $4
   local.get $1
   local.set $2
   global.get $src/assembly/config/EXAMPLE_COLOR
   local.set $5
   local.get $4
   local.get $2
   call $src/assembly/index/toPointer
   local.get $5
   i32.store
  end
 )
 (func $~lib/math/murmurHash3 (param $0 i64) (result i64)
  local.get $0
  local.get $0
  i64.const 33
  i64.shr_u
  i64.xor
  local.set $0
  local.get $0
  i64.const -49064778989728563
  i64.mul
  local.set $0
  local.get $0
  local.get $0
  i64.const 33
  i64.shr_u
  i64.xor
  local.set $0
  local.get $0
  i64.const -4265267296055464877
  i64.mul
  local.set $0
  local.get $0
  local.get $0
  i64.const 33
  i64.shr_u
  i64.xor
  local.set $0
  local.get $0
 )
 (func $~lib/math/splitMix32 (param $0 i32) (result i32)
  local.get $0
  i32.const 1831565813
  i32.add
  local.set $0
  local.get $0
  local.get $0
  i32.const 15
  i32.shr_u
  i32.xor
  local.get $0
  i32.const 1
  i32.or
  i32.mul
  local.set $0
  local.get $0
  local.get $0
  local.get $0
  local.get $0
  i32.const 7
  i32.shr_u
  i32.xor
  local.get $0
  i32.const 61
  i32.or
  i32.mul
  i32.add
  i32.xor
  local.set $0
  local.get $0
  local.get $0
  i32.const 14
  i32.shr_u
  i32.xor
 )
 (func $~lib/math/NativeMath.seedRandom (param $0 i64)
  local.get $0
  i64.const 0
  i64.eq
  if
   i64.const -7046029254386353131
   local.set $0
  end
  local.get $0
  call $~lib/math/murmurHash3
  global.set $~lib/math/random_state0_64
  global.get $~lib/math/random_state0_64
  i64.const -1
  i64.xor
  call $~lib/math/murmurHash3
  global.set $~lib/math/random_state1_64
  local.get $0
  i32.wrap_i64
  call $~lib/math/splitMix32
  global.set $~lib/math/random_state0_32
  global.get $~lib/math/random_state0_32
  call $~lib/math/splitMix32
  global.set $~lib/math/random_state1_32
  i32.const 1
  global.set $~lib/math/random_seeded
 )
 (func $~lib/math/NativeMath.random (result f64)
  (local $0 i64)
  (local $1 i64)
  (local $2 i64)
  global.get $~lib/math/random_seeded
  i32.eqz
  if
   call $~lib/builtins/seed
   i64.reinterpret_f64
   call $~lib/math/NativeMath.seedRandom
  end
  global.get $~lib/math/random_state0_64
  local.set $0
  global.get $~lib/math/random_state1_64
  local.set $1
  local.get $1
  global.set $~lib/math/random_state0_64
  local.get $0
  local.get $0
  i64.const 23
  i64.shl
  i64.xor
  local.set $0
  local.get $0
  local.get $0
  i64.const 17
  i64.shr_u
  i64.xor
  local.set $0
  local.get $0
  local.get $1
  i64.xor
  local.set $0
  local.get $0
  local.get $1
  i64.const 26
  i64.shr_u
  i64.xor
  local.set $0
  local.get $0
  global.set $~lib/math/random_state1_64
  local.get $1
  i64.const 12
  i64.shr_u
  i64.const 4607182418800017408
  i64.or
  local.set $2
  local.get $2
  f64.reinterpret_i64
  f64.const 1
  f64.sub
 )
 (func $src/assembly/index/fillRandomly
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  i32.const 0
  local.set $0
  loop $for-loop|0
   local.get $0
   global.get $src/assembly/index/width
   i32.lt_s
   local.set $1
   local.get $1
   if
    i32.const 0
    local.set $2
    loop $for-loop|1
     local.get $2
     global.get $src/assembly/index/height
     i32.lt_s
     local.set $3
     local.get $3
     if
      call $~lib/math/NativeMath.random
      f64.const 0.1
      f64.gt
      if (result i32)
       global.get $src/assembly/index/NO_COLOR
      else
       global.get $src/assembly/config/EXAMPLE_COLOR
      end
      local.set $4
      local.get $0
      local.set $7
      local.get $2
      local.set $6
      local.get $4
      local.set $5
      local.get $7
      local.get $6
      call $src/assembly/index/toPointer
      local.get $5
      i32.store
      local.get $2
      i32.const 1
      i32.add
      local.set $2
      br $for-loop|1
     end
    end
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $for-loop|0
   end
  end
 )
 (func $src/assembly/index/step
  call $src/assembly/index/fillRandomly
 )
 (func $src/assembly/index/recalculateMemory (param $0 i32) (param $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  local.get $0
  local.get $1
  call $src/assembly/index/init
  local.get $0
  local.get $1
  i32.mul
  i32.const 2
  i32.mul
  i32.const 2
  i32.shl
  local.set $2
  local.get $2
  i32.const 65535
  i32.add
  i32.const 65535
  i32.const -1
  i32.xor
  i32.and
  i32.const 16
  i32.shr_u
  local.set $3
  memory.size
  local.set $4
  local.get $3
  local.get $4
  i32.gt_s
  if
   local.get $3
   local.get $4
   i32.sub
   memory.grow
   drop
  end
 )
)
