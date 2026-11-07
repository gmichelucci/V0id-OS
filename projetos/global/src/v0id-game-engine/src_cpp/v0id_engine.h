#pragma once
#include <godot_cpp/classes/node2d.hpp>

namespace godot {

class V0idHighSpeedController : public Node2D {
    GDCLASS(V0idHighSpeedController, Node2D)

private:
    float speed = 450.0f;

protected:
    static void _bind_methods();

public:
    V0idHighSpeedController();
    ~V0idHighSpeedController();

    void _physics_process(double delta) override;
    void fire_projectile();
};

}
