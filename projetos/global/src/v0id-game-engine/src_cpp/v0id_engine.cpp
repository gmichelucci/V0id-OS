#include "v0id_engine.h"
#include <godot_cpp/core/class_db.hpp>
#include <godot_cpp/variant/utility_functions.hpp>

using namespace godot;

void V0idHighSpeedController::_bind_methods() {
    ClassDB::bind_method(D_METHOD("fire_projectile"), &V0idHighSpeedController::fire_projectile);
}

V0idHighSpeedController::V0idHighSpeedController() {}
V0idHighSpeedController::~V0idHighSpeedController() {}

void V0idHighSpeedController::_physics_process(double delta) {
    // Loop C++ nativo em código de máquina: zero GC, máxima taxa de quadros
}

void V0idHighSpeedController::fire_projectile() {
    UtilityFunctions::print("Laser disparado via C++ Nativo V0id Engine!");
}
