export interface PresetScript {
  title: string;
  category: string;
  description: string;
  prompt: string;
  code: string;
}

export const PRESET_SCRIPTS: PresetScript[] = [
  {
    title: 'Merge 2 Scripts: Camera Lerp & Combat Dash',
    category: 'Script Merging',
    description: 'Combines two independent scripts into a single, cohesive, conflict-free Roblox system.',
    prompt: 'Merge these two separate Roblox scripts together into one complete, fully working unified script. Combine their service imports, prevent variable conflicts, and wire their RunService and UserInputService loops together so both camera smoothing and combat dashing work seamlessly:',
    code: `---------------------------------------------------------
-- SCRIPT 1: Smooth Camera Lerp System (Client)
---------------------------------------------------------
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

local player = Players.LocalPlayer
local camera = Workspace.CurrentCamera
local CAMERA_LERP_SPEED = 12

local function updateCamera(dt: number)
    local character = player.Character
    if not character then return end
    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if not rootPart then return end

    -- Smooth target tracking CFrame calculation
    local targetCFrame = CFrame.new(rootPart.Position + Vector3.new(0, 3, 10), rootPart.Position)
    camera.CFrame = camera.CFrame:Lerp(targetCFrame, math.clamp(dt * CAMERA_LERP_SPEED, 0, 1))
end

RunService.RenderStepped:Connect(updateCamera)


---------------------------------------------------------
-- SCRIPT 2: Combat Dash Ability (Client)
---------------------------------------------------------
local UserInputService = game:GetService("UserInputService")
local Players = game:GetService("Players")

local player = Players.LocalPlayer
local DASH_SPEED = 65
local DASH_DURATION = 0.25
local DASH_COOLDOWN = 2.0

local isDashing = false
local lastDashTime = 0

UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    if input.KeyCode == Enum.KeyCode.Q then
        local now = os.clock()
        if (now - lastDashTime) < DASH_COOLDOWN or isDashing then return end
        lastDashTime = now
        isDashing = true

        local character = player.Character
        local humanoid = character and character:FindFirstChildOfClass("Humanoid")
        local rootPart = character and character:FindFirstChild("HumanoidRootPart")
        if not (humanoid and rootPart) then 
            isDashing = false
            return 
        end

        local moveDir = humanoid.MoveDirection
        if moveDir.Magnitude == 0 then
            moveDir = rootPart.CFrame.LookVector
        end

        local bodyVelocity = Instance.new("BodyVelocity")
        bodyVelocity.MaxForce = Vector3.new(1e5, 0, 1e5)
        bodyVelocity.Velocity = moveDir * DASH_SPEED
        bodyVelocity.Parent = rootPart

        task.delay(DASH_DURATION, function()
            bodyVelocity:Destroy()
            isDashing = false
        end)
    end
end)`,
  },
  {
    title: 'Server Sanity Check & Remote Validator',
    category: 'Security & Networking',
    description: 'Validates client action requests to prevent exploit manipulation without false cheat alarms.',
    prompt: 'Fix and harden this Roblox RemoteEvent handler. Validate player cooldowns, distance checks, and prevent spoofed data payloads while keeping server performance high.',
    code: `--!strict
-- ServerScriptService.Security.CombatValidator
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local AttackRemote = ReplicatedStorage:WaitForChild("AttackRemote") :: RemoteEvent
local ATTACK_COOLDOWN = 0.4
local MAX_REACH_DISTANCE = 14

local lastAttackMap: { [Player]: number } = {}

AttackRemote.OnServerEvent:Connect(function(player: Player, targetPart: Instance?, reportedHitPos: Vector3?)
    local character = player.Character
    if not character then return end
    local rootPart = character:FindFirstChild("HumanoidRootPart") :: BasePart?
    if not rootPart then return end

    -- Verify cooldown
    local now = os.clock()
    local lastTime = lastAttackMap[player] or 0
    if (now - lastTime) < (ATTACK_COOLDOWN - 0.05) then
        -- Cooldown violation, ignore packet safely
        return
    end
    lastAttackMap[player] = now

    -- Sanity check target & distance
    if not (targetPart and targetPart:IsA("BasePart")) then return end
    local targetChar = targetPart.Parent
    if not targetChar then return end
    local targetHumanoid = targetChar:FindFirstChildOfClass("Humanoid")
    if not targetHumanoid or targetHumanoid.Health <= 0 then return end

    local distance = (rootPart.Position - targetPart.Position).Magnitude
    if distance > MAX_REACH_DISTANCE then
        return -- Suspicious distance reach rejected
    end

    -- Process valid damage
    targetHumanoid:TakeDamage(25)
end)

Players.PlayerRemoving:Connect(function(player: Player)
    lastAttackMap[player] = nil
end)
`,
  },
  {
    title: 'Custom FastCast Raycast Projectile',
    category: 'Roblox Physics',
    description: 'High-speed raycasting projectile with piercing, reflection, and client visual prediction.',
    prompt: 'Review this custom raycast projectile system. Make sure the raycast parameters filter the player character properly, add bullet drop calculation, and optimize the RunService step.',
    code: `--!strict
-- StarterPlayerScripts.GunEngine
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

local localPlayer = Players.LocalPlayer

local function fireProjectile(origin: Vector3, direction: Vector3, velocity: number)
    local character = localPlayer.Character
    local raycastParams = RaycastParams.new()
    raycastParams.FilterType = RaycastFilterType.Exclude
    if character then
        raycastParams.FilterDescendantsInstances = { character }
    end
    raycastParams.IgnoreWater = true

    local currentPos = origin
    local currentVel = direction.Unit * velocity
    local gravity = Vector3.new(0, -Workspace.Gravity * 0.5, 0)
    local lifetime = 0
    local MAX_LIFETIME = 5

    local connection: RBXScriptConnection? = nil
    connection = RunService.Heartbeat:Connect(function(dt: number)
        lifetime += dt
        if lifetime >= MAX_LIFETIME then
            if connection then connection:Disconnect() end
            return
        end

        local stepOffset = (currentVel * dt) + (0.5 * gravity * dt * dt)
        currentVel += gravity * dt
        local nextPos = currentPos + stepOffset

        local raycastResult = Workspace:Raycast(currentPos, stepOffset, raycastParams)
        if raycastResult then
            if connection then connection:Disconnect() end
            -- Hit detected!
            print("Projectile hit:", raycastResult.Instance:GetFullName(), "at", raycastResult.Position)
            return
        end

        currentPos = nextPos
    end)
end
`,
  },
  {
    title: 'Metatable OOP State & Inventory Engine',
    category: 'Luau OOP',
    description: 'Object-oriented class with metatables, inheritance, and clean cleanup.',
    prompt: 'Optimize this OOP Lua class. Add strict typing annotations, prevent memory leaks on destroy, and support event signals without external heavy libraries.',
    code: `--!strict
-- ReplicatedStorage.Classes.Inventory
local Inventory = {}
Inventory.__index = Inventory

export type InventoryItem = {
    id: string,
    quantity: number,
    metadata: { [string]: any },
}

export type InventoryType = typeof(setmetatable({} :: {
    _owner: Player,
    _capacity: number,
    _items: { [string]: InventoryItem },
    _destroyed: boolean,
}, Inventory))

function Inventory.new(owner: Player, capacity: number?): InventoryType
    local self = setmetatable({}, Inventory)
    self._owner = owner
    self._capacity = capacity or 30
    self._items = {}
    self._destroyed = false
    return self
end

function Inventory:AddItem(id: string, qty: number): boolean
    if self._destroyed then return false end
    qty = qty or 1
    if self._items[id] then
        self._items[id].quantity += qty
        return true
    end
    -- Check capacity
    local count = 0
    for _ in pairs(self._items) do count += 1 end
    if count >= self._capacity then return false end

    self._items[id] = { id = id, quantity = qty, metadata = {} }
    return true
end

function Inventory:Destroy()
    if self._destroyed then return end
    self._destroyed = true
    table.clear(self._items)
    setmetatable(self :: any, nil)
end

return Inventory
`,
  },
  {
    title: 'Robust DataStore with Retry & Session Locking',
    category: 'Roblox Data',
    description: 'Safe player data loading, auto-saving, and error handling for Roblox production games.',
    prompt: 'Analyze this DataStore script. Make sure it protects against data loss, handles server crash edge cases, and prevents data race conditions when players switch servers fast.',
    code: `-- ServerScriptService.DataStoreManager
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local PlayerDataStore = DataStoreService:GetDataStore("PlayerData_v1")
local sessionData = {}

local function loadData(player)
    local key = "User_" .. player.UserId
    local success, result = pcall(function()
        return PlayerDataStore:GetAsync(key)
    end)

    if success then
        sessionData[player] = result or { Coins = 100, Level = 1, Inventory = {} }
    else
        warn("Failed to load data for " .. player.Name .. ": " .. tostring(result))
        -- Kick to prevent saving over corrupted empty state
        player:Kick("Data failed to load safely. Please rejoin.")
    end
end

local function saveData(player)
    local data = sessionData[player]
    if not data then return end
    local key = "User_" .. player.UserId

    local success, err = pcall(function()
        PlayerDataStore:SetAsync(key, data)
    end)
    if not success then
        warn("Could not save data for " .. player.Name .. ": " .. tostring(err))
    end
    sessionData[player] = nil
end

Players.PlayerAdded:Connect(loadData)
Players.PlayerRemoving:Connect(saveData)

game:BindToClose(function()
    for _, player in ipairs(Players:GetPlayers()) do
        task.spawn(saveData, player)
    end
end)
`,
  },
];
